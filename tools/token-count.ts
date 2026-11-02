import {mkdir, writeFile} from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import OpenAI from 'openai';
import type {InputTokenCountParams} from 'openai/resources/responses/input-tokens';
import type {FunctionTool} from 'openai/resources/responses/responses';

type McpTool = Awaited<ReturnType<Client['listTools']>>['tools'][number];

export interface CountCase {
  name: string;
  request: InputTokenCountParams;
}

export function createCountCases(
  tools: McpTool[],
  model: string,
  perTool: boolean,
): CountCase[] {
  const baseline: InputTokenCountParams = {model, input: 'Reply OK.'};
  const functions: FunctionTool[] = tools.map(tool => ({
    type: 'function',
    name: tool.name,
    ...(tool.description === undefined ? {} : {description: tool.description}),
    parameters: tool.inputSchema,
    strict: false,
  }));
  return [
    {name: 'baseline', request: baseline},
    {name: 'functions', request: {...baseline, tools: functions}},
    {
      name: 'catalog-as-text',
      request: {
        ...baseline,
        input: `${baseline.input}\n${JSON.stringify({tools})}`,
      },
    },
    ...(perTool
      ? functions.map(tool => ({
          name: tool.name,
          request: {...baseline, tools: [tool]},
        }))
      : []),
  ];
}

export async function countCases(client: OpenAI, cases: CountCase[]) {
  const results = [];
  for (const item of cases) {
    const {data, request_id: requestId} = await client.responses.inputTokens
      .count(item.request)
      .withResponse();
    results.push({
      name: item.name,
      inputTokens: data.input_tokens,
      requestId,
    });
  }
  const baseline = results.find(result => result.name === 'baseline');
  if (!baseline) throw new Error('A baseline count is required.');
  return results.map(result => ({
    ...result,
    deltaFromBaseline: result.inputTokens - baseline.inputTokens,
  }));
}

async function readCatalog() {
  const client = new Client({name: 'kaiten-token-count', version: '1.0.0'});
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL('../bin/cli.js', import.meta.url))],
    env: {
      KAITEN_ORIGIN: 'http://127.0.0.1:1',
      KAITEN_TOKEN: 'catalog-only-placeholder',
    },
    stderr: 'inherit',
  });
  try {
    await client.connect(transport);
    const tools: McpTool[] = [];
    const cursors = new Set<string>();
    let cursor: string | undefined;
    do {
      const page = await client.listTools(cursor ? {cursor} : {});
      tools.push(...page.tools);
      cursor = page.nextCursor;
      if (cursor && cursors.has(cursor))
        throw new Error('Repeated tools cursor.');
      if (cursor) cursors.add(cursor);
    } while (cursor);
    tools.sort((left, right) => left.name.localeCompare(right.name));
    return {server: client.getServerVersion(), tools};
  } finally {
    await client.close();
  }
}

async function main() {
  const {values} = parseArgs({
    options: {
      model: {type: 'string', default: 'gpt-6.1-sol'},
      output: {type: 'string'},
      'dry-run': {type: 'boolean', default: false},
      'per-tool': {type: 'boolean', default: false},
      help: {type: 'boolean', default: false},
    },
  });
  if (values.help) {
    console.log(
      'npm run tokens:count -- [--model gpt-6.1-sol] [--dry-run] [--per-tool] [--output directory]',
    );
    return;
  }
  if (!values['dry-run'] && !process.env.OPENAI_API_KEY?.trim()) {
    throw new Error(
      'Set OPENAI_API_KEY in your environment or .env.tokens; use --dry-run to export requests without OpenAI access.',
    );
  }
  const directory = resolve(
    values.output ??
      `artifacts/token-count/${new Date().toISOString().replace(/[:.]/g, '-')}`,
  );
  await mkdir(directory, {recursive: true});
  const catalog = await readCatalog();
  const cases = createCountCases(
    catalog.tools,
    values.model,
    values['per-tool'],
  );
  async function save(name: string, value: unknown) {
    await writeFile(
      resolve(directory, name),
      `${JSON.stringify(value, null, 2)}\n`,
    );
  }
  await save('catalog.json', catalog);
  await save('requests.json', cases);
  console.log(`Exported ${catalog.tools.length} tools to ${directory}`);
  if (values['dry-run']) {
    console.log(`Dry run: ${cases.length} requests prepared; no OpenAI calls.`);
    return;
  }
  console.log(`Counting ${cases.length} requests for ${values.model}...`);
  const client = new OpenAI({
    baseURL: 'https://api.openai.com/v1',
    maxRetries: 0,
    timeout: 60_000,
  });
  const results = await countCases(client, cases);
  await save('report.json', {
    measuredAt: new Date().toISOString(),
    model: values.model,
    toolCount: catalog.tools.length,
    method: 'OpenAI responses.inputTokens.count',
    notes: [
      'functions: name, description and inputSchema mapped to non-strict OpenAI functions; outputSchema and annotations excluded.',
      'catalog-as-text: full tools/list tools array serialized as compact JSON in user text; not native MCP overhead.',
      'Per-tool deltas are isolated measurements and need not sum to the full catalog delta.',
      'No tool calls, Kaiten HTTP requests or model generation performed. Not a measurement of Codex context.',
    ],
    results,
  });
  console.table(results);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch(error => {
    if (error instanceof OpenAI.APIError) {
      console.error(
        `OpenAI count failed: status=${error.status}, code=${error.code}, request_id=${error.requestID}.`,
      );
    } else {
      console.error(
        error instanceof Error ? error.message : 'Token count failed.',
      );
    }
    process.exitCode = 1;
  });
}
