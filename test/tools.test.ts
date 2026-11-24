import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness, startSourceHarness, token} from './harness.ts';
import {toolCases} from './tool-cases.ts';
import {apiCases, specialOperations} from './api-cases.ts';

test('single-request operations call the real library with the expected HTTP contract', async context => {
  const canonical = await startHarness(context);
  const sources = await startSourceHarness(context);
  assert.equal(canonical.client.getServerVersion()?.name, 'kaiten-mcp');
  const cases = [...toolCases, ...apiCases];
  assert.deepEqual(
    [...sources.operations.keys()].sort(),
    [
      ...cases.filter(item => !item.canonical).map(item => item.name),
      ...specialOperations,
    ].sort(),
  );
  for (const item of cases) {
    await context.test(item.name, async () => {
      const harness = item.canonical ? canonical : sources;
      if (item.canonical) {
        assert.equal(
          canonical.operations.get(item.name)?.tool.endsWith('_read'),
          item.method === 'GET',
        );
      }
      harness.reply(item.response, item.status);
      const count = harness.requests.length;
      const result = await harness.call(item.name, item.args);
      assert.notEqual(result.isError, true, JSON.stringify(result));
      assert.ok(result.structuredContent);
      if (item.expectedContent) {
        assert.deepEqual(result.structuredContent, item.expectedContent);
      } else if (item.canonical || apiCases.includes(item)) {
        assert.deepEqual(result.structuredContent, {result: item.response});
      }
      const text = result.content[0];
      assert.equal(text?.type, 'text');
      if (text?.type === 'text')
        assert.deepEqual(JSON.parse(text.text), result.structuredContent);
      assert.equal(harness.requests.length, count + 1);
      assert.deepEqual(harness.requests.at(-1), {
        method: item.method,
        path: `${item.api_prefix ?? '/api/v1'}${item.path}`,
        query: item.query ?? {},
        body: item.body,
        authorization: `Bearer ${token}`,
      });
    });
  }
  for (const harness of [canonical, sources]) {
    assert.equal(harness.stderr, '');
    assert.deepEqual(harness.protocolErrors, []);
  }
});

test('grouped tools reject unknown operations and mismatched arguments before HTTP', async context => {
  const harness = await startHarness(context);
  for (const request of [
    {operation: 'unknown', args: {}},
    {operation: 'get_card', args: {board_id: 2}},
    {
      operation: 'create_card',
      args: {body: {title: 'Wrong group', board_id: 2}},
    },
    {operation: 'get_card', args: {card_id: 10, unexpected: true}},
  ]) {
    const result = await harness.client.callTool({
      name: 'kaiten_cards_read',
      arguments: {request},
    });
    assert.equal(result.isError, true);
  }
  assert.equal(harness.requests.length, 0);
});
