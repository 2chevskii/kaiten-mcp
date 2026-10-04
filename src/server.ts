import {KaitenClient} from '@2chevskii/kaiten-client';
import {McpServer} from '@modelcontextprotocol/server';
import packageJson from '../package.json' with {type: 'json'};
import type {Configuration} from './config.ts';
import {ToolRegistry} from './tool-registry.ts';

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
  return {server, registry};
}
