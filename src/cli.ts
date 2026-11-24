#!/usr/bin/env node
import {readConfiguration} from './config.ts';
import {createServer} from './server.ts';
import {logger} from './logger.ts';
import {serveMcpStdio} from './stdio.ts';

function main(): void {
  const shutdown = new AbortController();
  const configuration = readConfiguration();
  // Validate the client configuration before waiting for a protocol opening.
  const {server} = createServer(configuration, shutdown.signal);
  serveMcpStdio(server, shutdown);
}

try {
  main();
} catch {
  logger.error(
    'Could not start Kaiten MCP. Check KAITEN_ORIGIN, KAITEN_TOKEN/KAITEN_TOKEN_FILE, KAITEN_API_VERSION, KAITEN_TIMEOUT_MS, KAITEN_CONTEXT_FILE, KAITEN_ADDON_SECRET/KAITEN_ADDON_SECRET_FILE and KAITEN_MAX_FILE_BYTES.',
  );
  process.exitCode = 1;
}
