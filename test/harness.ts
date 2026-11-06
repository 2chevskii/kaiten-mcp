import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import {once, EventEmitter} from 'node:events';
import {fileURLToPath} from 'node:url';
import type {TestContext} from 'node:test';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {temporaryDirectory} from './temporary-directory.ts';

export const cliPath = fileURLToPath(new URL('../bin/cli.js', import.meta.url));
export const token = 'fixture-only-secret';

export interface CapturedRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  body: unknown;
  authorization: string | undefined;
}

export async function startHarness(
  context: TestContext,
  timeoutMs = 30_000,
  environment: Record<string, string> = {},
) {
  const requests: CapturedRequest[] = [];
  const events = new EventEmitter();
  let respond = (_request: CapturedRequest, response: ServerResponse) => {
    response.setHeader('Content-Type', 'application/json');
    response.end('{}');
  };
  const http = createServer((request, response) => {
    void receive(request, response).catch(error => {
      response.destroy(error instanceof Error ? error : undefined);
    });
  });
  async function receive(request: IncomingMessage, response: ServerResponse) {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const url = new URL(request.url!, 'http://localhost');
    const body = Buffer.concat(chunks).toString();
    const captured = {
      method: request.method!,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      body: body ? (JSON.parse(body) as unknown) : undefined,
      authorization: request.headers.authorization,
    };
    requests.push(captured);
    respond(captured, response);
    events.emit('request', captured, response);
  }
  http.listen(0, '127.0.0.1');
  await once(http, 'listening');
  const address = http.address();
  if (!address || typeof address === 'string')
    throw new Error('Expected TCP address.');
  const client = new Client({name: 'kaiten-mcp-tests', version: '1.0.0'});
  context.after(async () => {
    await client.close();
    http.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      http.close(error => (error ? reject(error) : resolve())),
    );
  });
  const directory = temporaryDirectory(context);
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [cliPath],
    cwd: directory,
    env: {
      HOME: directory,
      USERPROFILE: directory,
      KAITEN_ORIGIN: `http://127.0.0.1:${address.port}`,
      KAITEN_TOKEN: token,
      KAITEN_TIMEOUT_MS: String(timeoutMs),
      ...environment,
    },
    stderr: 'pipe',
  });
  let stderr = '';
  transport.stderr?.on('data', chunk => {
    stderr += String(chunk);
  });
  const protocolErrors: Error[] = [];
  client.onerror = error => protocolErrors.push(error);
  await client.connect(transport);
  const {tools} = await client.listTools();
  const operations = new Map<
    string,
    {tool: string; schema: Record<string, unknown>}
  >();
  for (const tool of tools) {
    const request = (
      tool.inputSchema.properties as Record<string, {anyOf?: unknown[]}>
    ).request!;
    for (const variant of request.anyOf ?? [request]) {
      const properties = (
        variant as {
          properties: {
            operation: {const: string};
            args: Record<string, unknown>;
          };
        }
      ).properties;
      operations.set(properties.operation.const, {
        tool: tool.name,
        schema: properties.args,
      });
    }
  }
  return {
    operations,
    client,
    transport,
    requests,
    events,
    protocolErrors,
    get stderr() {
      return stderr;
    },
    reply(body: unknown, status = 200) {
      respond = (_request, response) => {
        response.writeHead(status, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(body));
      };
    },
    respond(handler: typeof respond) {
      respond = handler;
    },
    call(name: string, args: Record<string, unknown> = {}) {
      const operation = operations.get(name);
      if (!operation) throw new Error(`Unknown operation: ${name}`);
      return client.callTool({
        name: operation.tool,
        arguments: {request: {operation: name, args}},
      });
    },
  };
}

export const cardFixture = {
  id: 10,
  title: 'A card',
  board_id: 2,
  column_id: 3,
  lane_id: 4,
  state: 1,
  condition: 1,
  archived: false,
  owner_id: 5,
  due_date: null,
  updated: '2026-10-04T09:00:00Z',
  description: 'Full description',
  members: [],
  tags: [],
  properties: {id_7: 'initial'},
  checklists: [{id: 8, checklist_id: 8, name: 'Tasks', items: []}],
};
