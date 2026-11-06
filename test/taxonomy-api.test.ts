import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';

test('card type changes validate required fields and typed property configurations', async context => {
  const harness = await startHarness(context);
  for (const body of [
    {},
    {suggest_fields: false},
    {name: 'Task', card_properties: [{regular_property: 'invalid'}]},
  ]) {
    assert.equal(
      (await harness.call('cardTypes.updateCardType', {id: 7, body})).isError,
      true,
    );
  }
  assert.equal(
    (await harness.call('cardTypes.removeCardType', {id: 7})).isError,
    true,
  );
  assert.equal(harness.requests.length, 0);
});

test('tag iterator preserves IDs, space and search filters on each page', async context => {
  const harness = await startHarness(context);
  harness.respond((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(request.query.offset === '0' ? [{id: 8}] : []));
  });
  const result = await harness.call('tags.iterate', {
    query: {space_id: 1, ids: [8, 9], query: 'Urgent', limit: 2},
  });
  assert.deepEqual(result.structuredContent, {
    result: {items: [{id: 8}], truncated: false},
  });
  assert.deepEqual(
    harness.requests.map(request => request.query),
    [
      {space_id: '1', ids: '8,9', query: 'Urgent', limit: '2', offset: '0'},
      {space_id: '1', ids: '8,9', query: 'Urgent', limit: '2', offset: '1'},
    ],
  );
});
