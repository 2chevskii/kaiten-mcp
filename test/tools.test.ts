import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness, token} from './harness.ts';
import {toolCases} from './tool-cases.ts';

test('every advertised tool calls the real library with the expected HTTP contract', async context => {
  const harness = await startHarness(context);
  assert.equal(harness.client.getServerVersion()?.name, 'kaiten-mcp');
  const {tools} = await harness.client.listTools();
  assert.deepEqual(
    tools.map(tool => tool.name).sort(),
    toolCases.map(item => `kaiten_${item.name}`).sort(),
  );
  for (const tool of tools) {
    assert.ok(tool.description);
    assert.ok(tool.outputSchema);
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.equal(typeof tool.annotations?.readOnlyHint, 'boolean');
    if (tool.name.includes('delete_'))
      assert.equal(tool.annotations?.destructiveHint, true);
  }
  for (const item of toolCases) {
    await context.test(item.name, async () => {
      harness.reply(item.response);
      const count = harness.requests.length;
      const result = await harness.call(item.name, item.args);
      assert.notEqual(result.isError, true, JSON.stringify(result));
      assert.ok(result.structuredContent);
      const text = result.content[0];
      assert.equal(text?.type, 'text');
      if (text?.type === 'text')
        assert.deepEqual(JSON.parse(text.text), result.structuredContent);
      assert.equal(harness.requests.length, count + 1);
      assert.deepEqual(harness.requests.at(-1), {
        method: item.method,
        path: `/api/v1${item.path}`,
        query: item.query ?? {},
        body: item.body,
        authorization: `Bearer ${token}`,
      });
    });
  }
  assert.equal(harness.stderr, '');
  assert.deepEqual(harness.protocolErrors, []);
});
