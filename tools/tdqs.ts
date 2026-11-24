import {
  execFileSync,
  type ExecFileSyncOptionsWithStringEncoding,
} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {parseArgs, parseEnv} from 'node:util';
import {
  PACKAGE_VERSION,
  ScoreReportZodSchema,
  computeInputHash,
  lintServer,
  parseToolDefinitions,
  requestHostedReport,
  type ScoreReport,
  type ToolDefinition,
} from 'mcp-tdqs';
import {readCatalog} from './read-catalog.ts';

async function hostedKey() {
  const configured = process.env.TDQS_API_KEY?.trim();
  if (configured) return configured;
  let contents: string;
  try {
    contents = (await readFile('.env.tdqs', 'utf8')).trim();
  } catch (error) {
    if (!(
      error instanceof Error &&
      'code' in error &&
      error.code === 'ENOENT'
    )) {
      throw error;
    }
    throw new Error('Set TDQS_API_KEY or add it to .env.tdqs.', {cause: error});
  }
  const key = /^tdqs_[A-Za-z0-9_-]+$/.test(contents)
    ? contents
    : parseEnv(contents).TDQS_API_KEY?.trim();
  if (!key) throw new Error('Set TDQS_API_KEY or add it to .env.tdqs.');
  return key;
}

function gitMetadata() {
  try {
    const options: ExecFileSyncOptionsWithStringEncoding = {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    };
    return {
      revision: execFileSync('git', ['rev-parse', 'HEAD'], options).trim(),
      dirty: Boolean(
        execFileSync('git', ['status', '--porcelain'], options).trim(),
      ),
    };
  } catch {
    return {revision: null, dirty: null};
  }
}

export function verifyReportCatalog(
  report: ScoreReport,
  serverName: string,
  tools: readonly ToolDefinition[],
) {
  const hashes = new Map(
    tools.map(tool => [tool.name, computeInputHash(tool)]),
  );
  if (
    report.server.name !== serverName ||
    report.server.toolCount !== tools.length ||
    report.serverScore.toolCount !== tools.length ||
    report.tools.length !== tools.length ||
    hashes.size !== tools.length
  ) {
    throw new Error('TDQS report and built catalog do not match.');
  }
  for (const tool of report.tools) {
    if (hashes.get(tool.name) !== tool.contextSignals.inputHash) {
      throw new Error(`TDQS report definition mismatch for ${tool.name}.`);
    }
    hashes.delete(tool.name);
  }
}

type Scores = ScoreReport['tools'][number]['scores'];

export function belowPerfect(report: {
  tools: Array<{name: string; scores: Scores}>;
  serverScore: Pick<ScoreReport['serverScore'], 'coherenceJustifications'>;
}) {
  const groups = [
    ...report.tools.map(tool => ({name: tool.name, scores: tool.scores})),
    {
      name: 'server',
      scores: Object.fromEntries(
        Object.entries(report.serverScore.coherenceJustifications).map(
          ([key, dimension]) => [key, dimension.score],
        ),
      ),
    },
  ];
  return groups.flatMap(({name, scores}) =>
    Object.entries(scores)
      .filter(([, value]) => value !== 5)
      .map(([key, value]) => `${name} · ${key}: ${value}/5`),
  );
}

async function main() {
  const {positionals, values} = parseArgs({
    allowPositionals: true,
    options: {
      profile: {type: 'string'},
      output: {type: 'string'},
      strict: {type: 'boolean'},
      report: {type: 'string'},
    },
  });
  const [mode] = positionals;
  if (
    positionals.length !== 1 ||
    (mode !== 'lint' && mode !== 'score' && mode !== 'goal') ||
    (mode === 'goal' && values.report === undefined)
  ) {
    throw new Error(
      'Use lint, score, or goal --report score.json [--profile name] [--output directory] [--strict].',
    );
  }
  const catalog = await readCatalog(values.profile);
  const {tools} = parseToolDefinitions(catalog);
  const serverName = catalog.server.name;
  const lint = lintServer({serverName, tools});
  const directory = resolve(
    values.output ?? `artifacts/tdqs/${mode}-${Date.now()}`,
  );
  await mkdir(directory, {recursive: true});
  const save = async (name: string, body: unknown) => {
    await writeFile(
      resolve(directory, name),
      JSON.stringify(body, null, 2) + '\n',
    );
  };
  await save('catalog.json', catalog);
  await save('lint.json', lint);
  await save('provenance.json', {
    ...gitMetadata(),
    profile: values.profile ?? 'default',
    server: catalog.server,
    scorer: `mcp-tdqs@${PACKAGE_VERSION}`,
    lintSpec: lint.specVersion,
    definitionSha256: createHash('sha256')
      .update(JSON.stringify(catalog.tools))
      .digest('hex'),
  });
  const failures = lint.findings.filter(
    finding =>
      finding.severity === 'error' ||
      (values.strict && finding.severity === 'warning'),
  );
  console.log(
    `TDQS ${lint.specVersion}: ${tools.length} tools, ${lint.findings.length} lint findings. Artifacts: ${directory}`,
  );
  for (const finding of lint.findings) {
    console.log(
      `${finding.severity} ${finding.tool ?? 'server'} · ${finding.rule}`,
    );
  }
  if (failures.length > 0) process.exitCode = 1;
  if (mode === 'lint') return;

  let report: ScoreReport;
  if (mode === 'score') {
    const apiKey = await hostedKey();
    const hosted = await requestHostedReport({
      apiKey,
      hostedUrl: 'https://tdqs.dev',
      serverName,
      tools,
      timeoutMs: 180_000,
      onStatus: status => console.log(`Hosted TDQS: ${status}`),
    }).catch(() => {
      throw new Error(
        'Hosted TDQS request failed. Check the key and service availability.',
      );
    });
    await save('hosted.json', hosted);
    console.log(`Hosted report: ${hosted.url}`);
    report = ScoreReportZodSchema.parse(hosted.score);
  } else {
    const path = values.report!;
    report = ScoreReportZodSchema.parse(
      JSON.parse(await readFile(path, 'utf8')),
    );
  }
  verifyReportCatalog(report, serverName, tools);
  await save('score.json', report);
  const misses = belowPerfect(report);
  console.log(
    `TDQS ${report.specVersion} overall: ${report.serverScore.overallScore}/5`,
  );
  for (const miss of misses) console.log(miss);
  if (mode === 'goal' && misses.length > 0) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : 'TDQS failed.');
    process.exitCode = 2;
  });
}
