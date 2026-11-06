import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';

test('pagination advertises compact offsets and retains its limit contract', async context => {
  const harness = await startHarness(context);
  let offsets = 0;
  for (const operation of harness.operations.values()) {
    const fields = operation.schema.properties as Record<string, unknown>;
    if (!('offset' in fields)) continue;
    assert.deepEqual(fields.offset, {type: 'integer', minimum: 0, default: 0});
    assert.deepEqual(fields.limit, {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
    });
    offsets++;
  }
  assert.ok(offsets > 0);
});

test('compact offsets reject invalid values and preserve defaults and boundaries through HTTP', async context => {
  const harness = await startHarness(context);
  for (const offset of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, '0', null]) {
    assert.equal((await harness.call('list_spaces', {offset})).isError, true);
  }
  assert.equal(harness.requests.length, 0);
  harness.reply([]);
  assert.notEqual((await harness.call('list_spaces')).isError, true);
  assert.deepEqual(harness.requests.at(-1)?.query, {limit: '25', offset: '0'});
  for (const offset of [0, 1, Number.MAX_SAFE_INTEGER]) {
    assert.notEqual(
      (await harness.call('list_spaces', {offset})).isError,
      true,
    );
    assert.deepEqual(harness.requests.at(-1)?.query, {
      limit: '25',
      offset: String(offset),
    });
  }
});
