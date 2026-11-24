import assert from 'node:assert/strict';
import {test} from 'node:test';
import {KaitenClient} from '@2chevskii/kaiten-client';
import {Client} from '@modelcontextprotocol/client';
import {InMemoryTransport, McpServer} from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
const {ToolRegistry, read} = (await import(
  new URL('../bin/tool-registry.js', import.meta.url).href
)) as typeof import('../src/tool-registry.ts');

test('canonical variants advertise nested fields and dispatch to source-specific contracts', async context => {
  const server = new McpServer({name: 'catalog-fixture', version: '1.0.0'});
  const client = new Client({name: 'client-fixture', version: '1.0.0'});
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  context.after(async () => {
    await client.close();
    await server.close();
  });
  const registry = new ToolRegistry(
    server,
    new KaitenClient({origin: 'https://example.invalid', token: 'fixture'}),
    1_000,
    new AbortController().signal,
  );
  registry.add(
    'source.byId',
    z.strictObject({query: z.strictObject({id: z.number()}).optional()}),
    z.object({id: z.number()}),
    read,
    async args => ({id: args.query?.id ?? 0}),
  );
  registry.add(
    'source.byName',
    z.strictObject({name: z.string()}),
    z.object({name: z.string()}),
    read,
    async args => ({name: args.name}),
  );
  registry.register({
    workspace_read: {
      description: 'Resolve fixture accounts by ID or name.',
      operations: {
        find_account: [
          {
            source: 'source.byId',
            description: 'Look up the account by ID.',
            input: original => original.extend({lookup: z.literal('id')}),
            fields: {'query.id': 'Numeric account ID.'},
            outputFields: {id: 'ID of the account found.'},
            mapArgs: ({query}) => ({query}),
          },
          {
            source: 'source.byName',
            description: 'Look up the account by name.',
            input: original => original.extend({lookup: z.literal('name')}),
            fields: {name: 'Exact account name.'},
            mapArgs: ({name}) => ({name}),
          },
        ],
      },
    },
  });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  const {tools} = await client.listTools();
  const listed = JSON.stringify(tools);
  assert.match(listed, /Numeric account ID/);
  assert.match(listed, /Exact account name/);
  assert.match(listed, /ID of the account found/);
  assert.doesNotMatch(listed, /source\.(byId|byName)/);
  assert.equal(tools[0]?.outputSchema?.type, 'object');

  const call = (args: Record<string, unknown>) =>
    client.callTool({
      name: 'kaiten_workspace_read',
      arguments: {request: {operation: 'find_account', args}},
    });
  assert.deepEqual(
    (await call({lookup: 'id', query: {id: 7}})).structuredContent,
    {id: 7},
  );
  assert.deepEqual(
    (await call({lookup: 'name', name: 'Fixture'})).structuredContent,
    {name: 'Fixture'},
  );
  assert.equal(
    (await call({lookup: 'id', name: 'Wrong variant'})).isError,
    true,
  );
});
