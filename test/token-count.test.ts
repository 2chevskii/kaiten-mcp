import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createServer} from 'node:http';
import {test} from 'node:test';
import OpenAI from 'openai';
import {countCases, createCountCases} from '../tools/token-count.ts';
import {startHarness} from './harness.ts';

test('token lab counts advertised tools through the SDK without executing Kaiten tools', async context => {
  const harness = await startHarness(context);
  const {tools} = await harness.client.listTools();
  const cases = createCountCases(tools, 'gpt-6.1-sol', true);
  const captured: {url: string; method: string; body: unknown}[] = [];
  const http = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    captured.push({
      url: request.url!,
      method: request.method!,
      body: JSON.parse(Buffer.concat(chunks).toString()) as unknown,
    });
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('x-request-id', `mock-count-${captured.length}`);
    response.end(
      JSON.stringify({
        object: 'response.input_tokens',
        input_tokens: 10 + captured.length * 100,
      }),
    );
  });
  context.after(async () => {
    http.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      http.close(error => (error ? reject(error) : resolve())),
    );
  });
  http.listen(0, '127.0.0.1');
  await once(http, 'listening');
  const address = http.address();
  assert(address && typeof address !== 'string');
  const client = new OpenAI({
    apiKey: 'local-fixture-only',
    baseURL: `http://127.0.0.1:${address.port}/v1`,
    maxRetries: 0,
  });
  const results = await countCases(client, cases.slice(0, 3));
  assert.deepEqual(
    captured.map(item => ({url: item.url, method: item.method})),
    Array.from({length: 3}, () => ({
      url: '/v1/responses/input_tokens',
      method: 'POST',
    })),
  );
  assert.deepEqual(
    captured.map(item => item.body),
    cases.slice(0, 3).map(item => item.request),
  );
  assert.deepEqual(
    results.map(result => result.deltaFromBaseline),
    [0, 100, 200],
  );
  assert.equal(results[1]?.requestId, 'mock-count-2');
  const functions = cases[1]!.request.tools!;
  assert.equal(functions.length, tools.length);
  for (const tool of tools) {
    const mapped = functions.find(
      item => item.type === 'function' && item.name === tool.name,
    );
    assert(mapped?.type === 'function');
    assert.deepEqual(mapped.parameters, tool.inputSchema);
    assert.equal(mapped.description, tool.description);
    assert.equal(mapped.strict, false);
    assert.equal('outputSchema' in mapped, false);
    assert.equal('annotations' in mapped, false);
  }
  const serialized = cases[2]!.request.input;
  assert.equal(typeof serialized, 'string');
  assert.deepEqual(
    JSON.parse((serialized as string).split('\n').slice(1).join('\n')),
    {tools},
  );
  assert.equal(cases.length, tools.length + 3);
  assert.equal(cases[3]?.request.tools?.length, 1);
  assert.equal(harness.requests.length, 0);
});

test('token lab propagates API failures instead of reporting estimates', async () => {
  const client = new OpenAI({
    apiKey: 'local-fixture-only',
    maxRetries: 0,
    fetch: async () =>
      new Response(
        JSON.stringify({
          error: {
            message: 'Unknown model',
            type: 'invalid_request_error',
            code: 'model_not_found',
          },
        }),
        {status: 404, headers: {'Content-Type': 'application/json'}},
      ),
  });
  await assert.rejects(
    countCases(client, createCountCases([], 'unavailable-model', false)),
    error => error instanceof OpenAI.APIError && error.status === 404,
  );
});
