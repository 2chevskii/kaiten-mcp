#!/usr/bin/env node
import {serveStdio} from '@modelcontextprotocol/server/stdio';
import {readConfiguration} from './config.ts';
import {createServer} from './server.ts';
import {logger} from './logger.ts';

function main(): void {
  const shutdown = new AbortController();
  const configuration = readConfiguration();
  // Validate the client configuration before waiting for a protocol opening.
  const {server} = createServer(configuration, shutdown.signal);
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

try {
  main();
} catch {
  logger.error(
    'Could not start Kaiten MCP. Check KAITEN_ORIGIN, KAITEN_TOKEN and KAITEN_TIMEOUT_MS.',
  );
  process.exitCode = 1;
}
