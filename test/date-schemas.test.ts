import assert from 'node:assert/strict';
import {test} from 'node:test';
import {cardFixture, startHarness} from './harness.ts';

test('advertised date schemas retain formats without calendar patterns', async context => {
  const harness = await startHarness(context);
  const {tools} = await harness.client.listTools();
  let dates = 0;
  let dateTimes = 0;
  function inspect(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(inspect);
    } else if (value && typeof value === 'object') {
      const schema = value as Record<string, unknown>;
      if (schema.format === 'date' || schema.format === 'date-time') {
        assert.equal(schema.type, 'string');
        assert.equal('pattern' in schema, false);
        if (schema.format === 'date') dates++;
        else dateTimes++;
      }
      Object.values(schema).forEach(inspect);
    }
  }
  tools.forEach(tool => inspect(tool.inputSchema));
  assert.equal(dates, 6);
  assert.equal(dateTimes, 6);
});

test('compact date schemas still validate calendars and timezones before HTTP', async context => {
  const harness = await startHarness(context);
  const invalid = [
    'tomorrow',
    '2026-02-29',
    '1900-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-11-02T12:00:00',
    '2026-11-02T24:00:00Z',
    '2026-11-02T12:60:00Z',
    '2026-02-29T12:00:00+03:00',
    '2026-11-02T12:00:00+25:00',
    20261102,
  ];
  const cases: [string, (value: unknown) => Record<string, unknown>][] = [
    ['create_card', value => ({title: 'Dated', board_id: 2, due_date: value})],
    ['update_card', value => ({card_id: 10, changes: {due_date: value}})],
    ['search_cards', value => ({due_date_after: value})],
    ['search_cards', value => ({due_date_before: value})],
    [
      'add_checklist_item',
      value => ({card_id: 10, checklist_id: 8, text: 'Dated', due_date: value}),
    ],
    [
      'update_checklist_item',
      value => ({
        card_id: 10,
        checklist_id: 8,
        item_id: 9,
        changes: {due_date: value},
      }),
    ],
  ];
  for (const [name, args] of cases) {
    for (const value of invalid) {
      const result = await harness.call(name, args(value));
      assert.equal(result.isError, true, `${name}: ${JSON.stringify(value)}`);
    }
  }
  assert.equal(harness.requests.length, 0);

  const valid = [
    '2000-02-29',
    '2028-02-29',
    '2026-11-02T12:34:56Z',
    '2026-11-02T12:34:56.123+03:00',
    '2026-11-02T12:34:56-05:30',
  ];
  for (const [name, args] of cases) {
    harness.reply(name === 'search_cards' ? [] : cardFixture);
    for (const value of valid) {
      const count: number = harness.requests.length;
      const result = await harness.call(name, args(value));
      assert.notEqual(result.isError, true, `${name}: ${value}`);
      assert.equal(harness.requests.length, count + 1);
      const request = harness.requests.at(-1)!;
      if (name === 'search_cards') {
        const field =
          'due_date_after' in args(value)
            ? 'due_date_after'
            : 'due_date_before';
        assert.equal(request.query[field], value);
      } else {
        assert.equal((request.body as {due_date: string}).due_date, value);
      }
    }
  }
});
