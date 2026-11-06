import assert from 'node:assert/strict';
import {test} from 'node:test';
import {KaitenClient} from '@2chevskii/kaiten-client';
import {McpServer} from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
const {ToolRegistry, read} = (await import(
  new URL('../bin/tool-registry.js', import.meta.url).href
)) as typeof import('../src/tool-registry.ts');

test('registration permits 20 tools and rejects 21', () => {
  for (const count of [20, 21]) {
    const registry = new ToolRegistry(
      new McpServer({name: 'tool-limit', version: '1.0.0'}),
      new KaitenClient({origin: 'https://example.invalid', token: 'fixture'}),
      1_000,
      new AbortController().signal,
      '',
    );
    for (let i = 0; i < count; i++) {
      registry.group(`group_${i}`);
      registry.add(
        `operation_${i}`,
        'Read',
        z.strictObject({}),
        z.strictObject({}),
        read,
        async () => ({}),
      );
    }
    if (count === 20) assert.doesNotThrow(() => registry.register());
    else assert.throws(() => registry.register(), /must not exceed 20/);
  }
});
