import assert from 'node:assert/strict';
import {once} from 'node:events';
import {test} from 'node:test';
import type {ServerResponse} from 'node:http';
import {cardFixture, startHarness} from './harness.ts';

const summary = {
  id: 20,
  title: 'Child',
  board_id: 2,
  column_id: 3,
  lane_id: null,
};

test('card details preserve empty, multiple and absent hierarchy references', async context => {
  const harness = await startHarness(context);
  for (const references of [
    {},
    {parents: [], children: []},
    {
      parents: [summary, {...summary, id: 21}],
      children: [
        {...summary, id: 30},
        {...summary, id: 31},
      ],
    },
  ]) {
    harness.reply({...cardFixture, ...references});
    const result = await harness.call('get_card', {card_id: 10});
    assert.notEqual(result.isError, true);
    const {item} = result.structuredContent as {item: Record<string, unknown>};
    assert.deepEqual(
      item.parents,
      'parents' in references ? references.parents : undefined,
    );
    assert.deepEqual(
      item.children,
      'children' in references ? references.children : undefined,
    );
    assert.equal(item.description, cardFixture.description);
    assert.deepEqual(item.members, cardFixture.members);
    assert.deepEqual(item.tags, cardFixture.tags);
    assert.deepEqual(item.properties, cardFixture.properties);
    assert.deepEqual(item.checklists, [
      {id: 8, checklist_id: 8, name: 'Tasks'},
    ]);
  }
});

test('child lists paginate locally and strip unrelated upstream fields', async context => {
  const harness = await startHarness(context);
  harness.reply([]);
  assert.deepEqual(
    (await harness.call('list_card_children', {parent_card_id: 10}))
      .structuredContent,
    {items: [], next_offset: null},
  );
  harness.reply([
    {...summary, email_key: 'private', card_id: 999, depends_on_card_id: 10},
    {...summary, id: 21},
    {...summary, id: 22},
  ]);
  for (const [offset, next] of [
    [0, 1],
    [1, 2],
    [2, null],
    [3, null],
  ] as const) {
    const result = await harness.call('list_card_children', {
      parent_card_id: 10,
      limit: 1,
      offset,
    });
    assert.deepEqual(result.structuredContent, {
      items: offset < 3 ? [{...summary, id: 20 + offset}] : [],
      next_offset: next,
    });
    assert.deepEqual(harness.requests.at(-1)?.query, {});
  }
});

test('link and unlink use child card IDs and preserve other relationships and card data', async context => {
  const harness = await startHarness(context);
  const children = new Set([21]);
  harness.respond((request, response) => {
    if (request.method === 'POST') {
      assert.equal(request.path, '/api/v1/cards/10/children');
      assert.deepEqual(request.body, {card_id: 20});
      children.add(20);
      response.end(JSON.stringify({...summary, email_key: 'private'}));
    } else if (request.method === 'DELETE') {
      assert.equal(request.path, '/api/v1/cards/10/children/20');
      assert.equal(request.body, undefined);
      children.delete(20);
      response.end(JSON.stringify({id: 20}));
    } else {
      assert.equal(request.path, '/api/v1/cards/10');
      response.end(
        JSON.stringify({
          ...cardFixture,
          parents: [{...summary, id: 5}],
          children: [...children].map(id => ({...summary, id})),
        }),
      );
    }
  });
  const added = await harness.call('add_card_child', {
    parent_card_id: 10,
    child_card_id: 20,
  });
  assert.deepEqual(added.structuredContent, {item: summary});
  const removed = await harness.call('remove_card_child', {
    parent_card_id: 10,
    child_card_id: (added.structuredContent as {item: {id: number}}).item.id,
  });
  assert.deepEqual(removed.structuredContent, {item: {id: 20}});
  const result = await harness.call('get_card', {card_id: 10});
  const {item} = result.structuredContent as {item: Record<string, unknown>};
  assert.deepEqual(item.children, [{...summary, id: 21}]);
  assert.deepEqual(item.parents, [{...summary, id: 5}]);
  assert.equal(item.description, cardFixture.description);
  assert.deepEqual(item.tags, cardFixture.tags);
  assert.equal(harness.requests.length, 3);
});

test('hierarchy arguments reject invalid IDs and pagination before HTTP', async context => {
  const harness = await startHarness(context);
  for (const name of [
    'list_card_children',
    'add_card_child',
    'remove_card_child',
  ]) {
    const valid =
      name === 'list_card_children'
        ? {parent_card_id: 10}
        : {parent_card_id: 10, child_card_id: 20};
    const fields =
      name === 'list_card_children'
        ? ['parent_card_id']
        : ['parent_card_id', 'child_card_id'];
    for (const field of fields) {
      for (const invalid of [
        undefined,
        null,
        '20',
        0,
        -1,
        1.5,
        Number.MAX_SAFE_INTEGER + 1,
      ]) {
        assert.equal(
          (await harness.call(name, {...valid, [field]: invalid})).isError,
          true,
        );
      }
    }
    assert.equal(
      (await harness.call(name, {...valid, relationship_id: 99})).isError,
      true,
    );
  }
  for (const page of [{limit: 0}, {limit: 101}, {offset: -1}, {offset: 0.5}]) {
    assert.equal(
      (await harness.call('list_card_children', {parent_card_id: 10, ...page}))
        .isError,
      true,
    );
  }
  assert.equal(harness.requests.length, 0);
});

test('hierarchy API failures are sanitized and writes are not retried', async context => {
  const harness = await startHarness(context);
  for (const name of [
    'list_card_children',
    'add_card_child',
    'remove_card_child',
  ]) {
    const args =
      name === 'list_card_children'
        ? {parent_card_id: 10}
        : {parent_card_id: 10, child_card_id: 20};
    for (const status of [403, 404, 422, 500]) {
      harness.reply({message: 'private upstream details'}, status);
      const before = harness.requests.length;
      const result = await harness.call(name, args);
      assert.equal(result.isError, true);
      assert.match(JSON.stringify(result), /KAITEN_HTTP_ERROR/);
      assert.doesNotMatch(JSON.stringify(result), /private upstream details/);
      assert.equal(harness.requests.length, before + 1);
    }
  }
});

test('cancelling a hierarchy mutation aborts its HTTP request', async context => {
  const harness = await startHarness(context);
  harness.respond(() => {});
  const controller = new AbortController();
  const received = once(harness.events, 'request', {
    signal: AbortSignal.timeout(5000),
  });
  const pending = harness.client.callTool(
    {
      name: 'kaiten_add_card_child',
      arguments: {parent_card_id: 10, child_card_id: 20},
    },
    {signal: controller.signal},
  );
  const rejected = assert.rejects(pending);
  const [, response] = (await received) as [unknown, ServerResponse];
  const closed = once(response, 'close', {signal: AbortSignal.timeout(5000)});
  controller.abort();
  await rejected;
  await closed;
  assert.equal(harness.requests.length, 1);
});
