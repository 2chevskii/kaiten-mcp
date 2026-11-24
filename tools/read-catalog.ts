import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';

type McpTool = Awaited<ReturnType<Client['listTools']>>['tools'][number];

export async function readCatalog() {
  const directory = await mkdtemp(join(tmpdir(), 'kaiten-catalog-'));
  const client = new Client({name: 'kaiten-catalog', version: '1.0.0'});
  try {
    const contextPath = join(directory, 'context.json');
    await writeFile(contextPath, '{}');
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [fileURLToPath(new URL('../bin/cli.js', import.meta.url))],
      env: {
        KAITEN_ORIGIN: 'https://example.invalid',
        KAITEN_TOKEN: 'catalog-only-placeholder',
        KAITEN_CONTEXT_FILE: contextPath,
      },
      stderr: 'inherit',
    });
    await client.connect(transport);
    const tools: McpTool[] = [];
    const cursors = new Set<string>();
    let cursor: string | undefined;
    do {
      const page = await client.listTools(cursor ? {cursor} : {});
      tools.push(...page.tools);
      cursor = page.nextCursor;
      if (cursor && cursors.has(cursor)) {
        throw new Error('Repeated tools cursor.');
      }
      if (cursor) cursors.add(cursor);
    } while (cursor);
    tools.sort((left, right) => left.name.localeCompare(right.name));
    const server = client.getServerVersion();
    if (server === undefined || tools.length === 0) {
      throw new Error('Expected a server version and a nonempty MCP catalog.');
    }
    return {server, tools};
  } finally {
    try {
      await client.close();
    } finally {
      await rm(directory, {recursive: true});
    }
  }
}
