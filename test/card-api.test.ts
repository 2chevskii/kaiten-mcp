import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';

test('structured filters are encoded by the client for local and HTTP use', async context => {
  const harness = await startHarness(context);
  const filter = {
    key: 'and',
    value: [
      {
        key: 'or',
        value: [
          {
            key: 'custom_property',
            id: 7,
            type: 'string',
            comparison: 'contains',
            value: 'Русский текст',
          },
          {key: 'due_date', comparison: 'unknown'},
          {
            key: 'partial_path',
            comparison: 'eq',
            value: {id: 2, type: 'board', spaceId: 1},
          },
        ],
      },
    ],
  };
  const encoded = Buffer.from(JSON.stringify(filter), 'utf8').toString(
    'base64',
  );
  const local = await harness.call('encodeCardFilter', {filter});
  assert.deepEqual(local.structuredContent, {result: encoded});
  assert.equal(harness.requests.length, 0);
  harness.reply([]);
  assert.notEqual(
    (await harness.call('cards.retrieveCardList', {query: {filter}})).isError,
    true,
  );
  assert.deepEqual(harness.requests.at(-1)?.query, {filter: encoded});
});

test('search v2 iterator follows opaque cursors and preserves filters', async context => {
  const harness = await startHarness(context);
  harness.respond((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.end(
      JSON.stringify(
        request.query.start_position === 'second'
          ? {result: [{id: 2}], position: ''}
          : {result: [{id: 1}], position: 'second'},
      ),
    );
  });
  const result = await harness.call('cards.iterate', {
    query: {query: 'work', archived: false, limit: 1},
  });
  assert.deepEqual(result.structuredContent, {
    result: {items: [{id: 1}, {id: 2}], truncated: false},
  });
  assert.deepEqual(
    harness.requests.map(request => request.query),
    [
      {query: 'work', archived: 'false', limit: '1', version: '2'},
      {
        query: 'work',
        archived: 'false',
        limit: '1',
        version: '2',
        start_position: 'second',
      },
    ],
  );
});

test('iterator bounds returned items and closes without reading more pages', async context => {
  const harness = await startHarness(context);
  harness.reply({result: [{id: 1}, {id: 2}, {id: 3}], position: 'unused'});
  const result = await harness.call('cards.iterate', {max_items: 2});
  assert.deepEqual(result.structuredContent, {
    result: {items: [{id: 1}, {id: 2}], truncated: true},
  });
  assert.equal(harness.requests.length, 1);
});

test('iterator reports repeated cursors as a sanitized failure', async context => {
  const harness = await startHarness(context);
  harness.reply({result: [{id: 1}], position: 'repeat'});
  const result = await harness.call('cards.iterate');
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result), /INTERNAL_ERROR/);
  assert.equal(harness.requests.length, 2);
});

test('card API validates full bodies, batch selectors and filter predicates', async context => {
  const harness = await startHarness(context);
  for (const body of [
    {},
    {attributes: {title: 'Unscoped'}},
    {column_id: 3, order_by: {direction: 'asc'}},
    {board_id: 2},
  ]) {
    assert.equal(
      (await harness.call('cards.batchUpdateForCards', {body})).isError,
      true,
    );
  }
  for (const condition of [
    {key: 'asap', comparison: 'true', value: true},
    {
      key: 'custom_property',
      id: 7,
      type: 'number',
      comparison: 'gt',
      value: 10,
    },
    {key: 'due_date', comparison: 'unknown', value: null},
    {key: 'id', comparison: 'contains', value: 10},
  ]) {
    assert.equal(
      (
        await harness.call('encodeCardFilter', {
          filter: {key: 'and', value: [{key: 'and', value: [condition]}]},
        })
      ).isError,
      true,
    );
  }
  assert.equal(harness.requests.length, 0);
  harness.reply({id: 'job'});
  assert.notEqual(
    (
      await harness.call('cards.batchUpdateForCards', {
        body: {
          column_id: 3,
          lane_id: 4,
          order_by: {field_type: 'title', direction: 'asc'},
        },
      })
    ).isError,
    true,
  );
  assert.deepEqual(harness.requests.at(-1)?.body, {
    column_id: 3,
    lane_id: 4,
    order_by: {field_type: 'title', direction: 'asc'},
  });
});
