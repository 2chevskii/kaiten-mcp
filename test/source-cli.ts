import * as z from 'zod/v4';

const {readConfiguration} = (await import(
  new URL('../bin/config.js', import.meta.url).href
)) as typeof import('../src/config.ts');
const {createToolRegistry} = (await import(
  new URL('../bin/server.js', import.meta.url).href
)) as typeof import('../src/server.ts');
const {change, operationResult} = (await import(
  new URL('../bin/tool-registry.js', import.meta.url).href
)) as typeof import('../src/tool-registry.ts');
const {serveMcpStdio} = (await import(
  new URL('../bin/stdio.js', import.meta.url).href
)) as typeof import('../src/stdio.ts');

const shutdown = new AbortController();
const {server, registry} = createToolRegistry(
  readConfiguration(),
  shutdown.signal,
);
const requests = Array.from(registry.sources, ([name, source]) =>
  z.strictObject({operation: z.literal(name), args: source.input}),
);
registry.registerTool(
  'source_operations',
  'Exercise registered Kaiten source contracts in test fixtures.',
  z.strictObject({request: z.union(requests)}),
  z.looseObject({}),
  change,
  async ({operation, args}, options) => {
    const source = registry.sources.get(operation)!;
    return operationResult(await source.execute(args, options), source.output);
  },
);
serveMcpStdio(server, shutdown);
