import type {McpServer} from '@modelcontextprotocol/server';
import {serveStdio} from '@modelcontextprotocol/server/stdio';
import {logger} from './logger.ts';

export function serveMcpStdio(
  server: McpServer,
  shutdown: AbortController,
): void {
  const handle = serveStdio(() => server, {
    onerror: () => logger.error('MCP transport error.'),
  });
  let closing = false;
  const close = () => {
    if (closing) return;
    closing = true;
    shutdown.abort();
    void handle.close().catch(() => {
      logger.error('Could not close the MCP transport.');
      process.exitCode = 1;
    });
  };
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
  process.stdin.once('end', close);
}
