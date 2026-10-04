import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import packageJson from '../package.json' with {type: 'json'};

const [archive] = process.argv.slice(2);
if (!archive || !process.env.npm_execpath) {
  throw new Error('Run npm run package:check -- <package.tgz>.');
}

const directory = await mkdtemp(join(tmpdir(), 'kaiten-mcp-package-'));
const client = new Client({name: 'package-check', version: '1.0.0'});
try {
  execFileSync(
    process.execPath,
    [
      process.env.npm_execpath,
      'install',
      '--prefix',
      directory,
      '--registry=https://registry.npmjs.org',
      '--omit=dev',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      resolve(archive),
    ],
    {cwd: directory, stdio: 'inherit'},
  );

  const packageDirectory = join(
    directory,
    'node_modules/@2chevskii/kaiten-mcp',
  );
  const installed = JSON.parse(
    await readFile(join(packageDirectory, 'package.json'), 'utf8'),
  );
  assert.equal(installed.name, packageJson.name);
  assert.equal(installed.version, packageJson.version);
  assert.equal(installed.private, undefined);
  assert.equal(installed.dependencies['@2chevskii/kaiten-client'], '1.0.2');

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(packageDirectory, installed.bin['kaiten-mcp'])],
    cwd: directory,
    env: {
      KAITEN_ORIGIN: 'https://package-check.invalid',
      KAITEN_TOKEN: 'package-check-only',
    },
    stderr: 'inherit',
  });
  await client.connect(transport);
  assert.equal(client.getServerVersion()?.version, packageJson.version);
  const {tools} = await client.listTools();
  assert(tools.some(tool => tool.name === 'kaiten_list_spaces'));
  assert(tools.some(tool => tool.name === 'kaiten_create_card'));
  console.log(
    `Installed ${installed.name}@${installed.version}: MCP handshake and tools/list passed.`,
  );
} finally {
  try {
    await client.close();
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
}
