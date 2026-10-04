#!/usr/bin/env node
import {serveStdio} from '@modelcontextprotocol/server/stdio';
import {readConfiguration} from './config.ts';
import {createServer} from './server.ts';

function main(): void {
  const shutdown = new AbortController();
  const configuration = readConfiguration();
  // Validate the client configuration before waiting for a protocol opening.
  const {server} = createServer(configuration, shutdown.signal);
  const handle = serveStdio(() => server, {
    onerror: () => process.stderr.write('MCP transport error.\n'),
  });
  let closing = false;
  const close = () => {
    if (closing) return;
    closing = true;
    shutdown.abort();
    void handle.close().catch(() => {
      process.stderr.write('Could not close the MCP transport.\n');
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
  process.stderr.write(
    'Could not start Kaiten MCP. Check KAITEN_ORIGIN, KAITEN_TOKEN and KAITEN_TIMEOUT_MS.\n',
  );
  process.exitCode = 1;
}
