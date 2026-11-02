import assert from 'node:assert/strict';
import {test} from 'node:test';
import {cardFixture, startHarness} from './harness.ts';

test('ID and UUID schemas advertise compact contracts', async context => {
  const harness = await startHarness(context);
  const {tools} = await harness.client.listTools();
  const card = tools.find(tool => tool.name === 'kaiten_get_card')!;
  const properties = card.inputSchema.properties as Record<string, unknown>;
  assert.deepEqual(properties.card_id, {type: 'integer', exclusiveMinimum: 0});
  const directory = tools.find(
    tool => tool.name === 'kaiten_list_custom_directory_records',
  )!;
  const fields = directory.inputSchema.properties as Record<string, unknown>;
  assert.deepEqual(fields.directory_id, {type: 'string', format: 'uuid'});
});

test('compact IDs still reject invalid scalar and array values before HTTP', async context => {
  const harness = await startHarness(context);
  const invalid = [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '1', null];
  for (const value of invalid) {
    for (const [name, args] of [
      ['get_card', {card_id: value}],
      ['search_cards', {owner_ids: [value]}],
      ['update_card', {card_id: 10, changes: {owner_id: value}}],
    ] as const) {
      assert.equal((await harness.call(name, args)).isError, true);
    }
  }
  assert.equal(harness.requests.length, 0);
  harness.reply(cardFixture);
  for (const value of [1, Number.MAX_SAFE_INTEGER]) {
    assert.notEqual(
      (await harness.call('get_card', {card_id: value})).isError,
      true,
    );
    assert.equal(harness.requests.at(-1)?.path, `/api/v1/cards/${value}`);
    assert.notEqual(
      (
        await harness.call('update_card', {
          card_id: 10,
          changes: {owner_id: value},
        })
      ).isError,
      true,
    );
    assert.deepEqual(harness.requests.at(-1)?.body, {owner_id: value});
    harness.reply([]);
    assert.notEqual(
      (await harness.call('search_cards', {owner_ids: [value]})).isError,
      true,
    );
    assert.equal(harness.requests.at(-1)?.query.owner_ids, String(value));
    harness.reply(cardFixture);
  }
});

test('compact UUIDs retain version and variant validation before HTTP', async context => {
  const harness = await startHarness(context);
  for (const directory_id of [
    'not-a-uuid',
    '../other',
    '550e8400e29b41d4a716446655440000',
    '550e8400-e29b-01d4-a716-446655440000',
    '550e8400-e29b-41d4-7716-446655440000',
    123,
    null,
  ]) {
    assert.equal(
      (await harness.call('list_custom_directory_records', {directory_id}))
        .isError,
      true,
    );
  }
  assert.equal(harness.requests.length, 0);
  harness.reply([]);
  for (const directory_id of [
    '550e8400-e29b-41d4-a716-446655440000',
    '550E8400-E29B-41D4-A716-446655440000',
    '00000000-0000-0000-0000-000000000000',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
  ]) {
    assert.notEqual(
      (await harness.call('list_custom_directory_records', {directory_id}))
        .isError,
      true,
    );
    assert.equal(
      harness.requests.at(-1)?.path,
      `/api/v1/company/custom-directories/${directory_id}/records`,
    );
  }
});
