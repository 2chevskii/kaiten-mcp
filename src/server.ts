import {KaitenClient} from '@2chevskii/kaiten-client';
import {McpServer} from '@modelcontextprotocol/server';
import packageJson from '../package.json' with {type: 'json'};
import type {Configuration} from './config.ts';
import {ToolRegistry} from './tool-registry.ts';
import {registerNavigation} from './tools/navigation.ts';
import {registerCardRead} from './tools/card-read.ts';
import {registerCardWrite} from './tools/card-write.ts';
import {registerComments} from './tools/comments.ts';
import {registerCardRelations} from './tools/card-relations.ts';
import {registerChecklists} from './tools/checklists.ts';
import {registerCustomProperties} from './tools/custom-properties.ts';

export function createServer(
  configuration: Configuration,
  shutdownSignal: AbortSignal,
) {
  const client = new KaitenClient({
    origin: configuration.origin,
    token: configuration.token,
  });
  const server = new McpServer({
    name: 'kaiten-mcp',
    version: packageJson.version,
  });
  const registry = new ToolRegistry(
    server,
    client,
    configuration.timeoutMs,
    shutdownSignal,
  );
  registerNavigation(registry);
  registerCardRead(registry);
  registerCardWrite(registry);
  registerComments(registry);
  registerCardRelations(registry);
  registerChecklists(registry);
  registerCustomProperties(registry);
  return {server};
}
