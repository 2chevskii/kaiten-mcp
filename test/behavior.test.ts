import assert from 'node:assert/strict';
import {once} from 'node:events';
import {test} from 'node:test';
import type {ServerResponse} from 'node:http';
import type {CallToolResult} from '@modelcontextprotocol/client';
import {cardFixture, startHarness, token} from './harness.ts';

function errorPayload(result: CallToolResult) {
  assert.equal(result.isError, true);
  const content = result.content[0];
  assert.equal(content?.type, 'text');
  if (content?.type !== 'text') throw new Error('Expected text error.');
  return JSON.parse(content.text) as {code: string; status?: number};
}

test('pagination and compact projections retain navigation and full requested text', async context => {
  const harness = await startHarness(context);
  harness.reply({result: [cardFixture], position: 'next-page'});
  const first = await harness.call('search_cards', {board_id: 2, limit: 1});
  const summary = {
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
  };
  assert.deepEqual(first.structuredContent, {
    items: [summary],
    next_cursor: 'next-page',
  });
  harness.reply({result: [], position: ''});
  const last = await harness.call('search_cards', {
    board_id: 2,
    limit: 1,
    cursor: 'next-page',
  });
  assert.deepEqual(last.structuredContent, {items: [], next_cursor: null});
  assert.equal(harness.requests.at(-1)?.query.start_position, 'next-page');

  harness.reply([{id: 1, title: 'One'}]);
  assert.deepEqual(
    (await harness.call('list_spaces', {limit: 1, offset: 3}))
      .structuredContent,
    {items: [{id: 1, title: 'One'}], next_offset: 4},
  );
  harness.reply([]);
  assert.deepEqual(
    (await harness.call('list_spaces', {limit: 1, offset: 4}))
      .structuredContent,
    {items: [], next_offset: null},
  );
  harness.reply([
    {id: 1, title: 'One'},
    {id: 2, title: 'Two'},
    {id: 3, title: 'Three'},
  ]);
  assert.deepEqual(
    (await harness.call('list_boards', {space_id: 1, limit: 1, offset: 1}))
      .structuredContent,
    {items: [{id: 2, title: 'Two'}], next_offset: 2},
  );
  assert.deepEqual(harness.requests.at(-1)?.query, {});
  assert.deepEqual(
    (await harness.call('list_boards', {space_id: 1, limit: 1, offset: 2}))
      .structuredContent,
    {items: [{id: 3, title: 'Three'}], next_offset: null},
  );

  const longText = 'Description. '.repeat(2000);
  harness.reply({...cardFixture, description: longText, email_key: token});
  const detail = await harness.call('get_card', {card_id: 10});
  const {item} = detail.structuredContent as {item: Record<string, unknown>};
  assert.equal(item.description, longText);
  assert.deepEqual(item.checklists, [{id: 8, checklist_id: 8, name: 'Tasks'}]);
  assert.ok(!('email_key' in item));
  harness.reply([{id: 1, text: longText, author_id: 5}]);
  const comments = await harness.call('list_comments', {card_id: 10});
  assert.deepEqual(comments.structuredContent, {
    items: [{id: 1, text: longText, author_id: 5}],
    next_offset: null,
  });
});

test('invalid arguments never reach Kaiten', async context => {
  const harness = await startHarness(context);
  const cases: [string, Record<string, unknown>][] = [
    ['get_card', {card_id: -1}],
    ['get_card', {card_id: 1.5}],
    ['get_card', {card_id: '1'}],
    ['get_card', {card_id: Number.MAX_SAFE_INTEGER + 1}],
    ['get_card', {}],
    ['get_card', {card_id: 1, unknown: true}],
    ['create_card', {title: '', board_id: 1}],
    ['update_card', {card_id: 1, changes: {}}],
    ['update_card', {card_id: 1, changes: {board_id: 2}}],
    ['update_card', {card_id: 1, changes: {due_date: 'tomorrow'}}],
    ['search_cards', {states: [4]}],
    ['search_cards', {limit: 101}],
    ['list_spaces', {limit: 0}],
    ['list_spaces', {offset: -1}],
    ['move_card', {card_id: 1, board_id: 2}],
    ['set_card_properties', {card_id: 1, properties: {bad_key: 1}}],
    ['set_card_properties', {card_id: 1, properties: {}}],
    ['update_checklist', {card_id: 1, checklist_id: 2, changes: {}}],
    [
      'update_checklist_item',
      {card_id: 1, checklist_id: 2, item_id: 3, changes: {}},
    ],
    ['list_custom_directory_records', {directory_id: '../other'}],
  ];
  for (const [name, args] of cases) {
    const result = await harness.call(name, args);
    assert.equal(result.isError, true, `${name}: ${JSON.stringify(args)}`);
  }
  assert.equal(harness.requests.length, 0);
  harness.reply([]);
  assert.notEqual(
    (await harness.call('list_spaces', {limit: 100})).isError,
    true,
  );
  assert.equal(harness.requests[0]?.query.limit, '100');
});

test('updates preserve null, false, zero and omitted fields', async context => {
  const harness = await startHarness(context);
  harness.reply(cardFixture);
  await harness.call('update_card', {
    card_id: 10,
    changes: {description: null, due_date: null, asap: false},
  });
  assert.deepEqual(harness.requests.at(-1)?.body, {
    description: null,
    due_date: null,
    asap: false,
  });
  const values = {
    id_1: null,
    id_2: 0,
    id_3: '',
    id_4: [12, 13],
    id_5: {date: '2026-10-04', time: '12:30:00', tzOffset: 180},
  };
  await harness.call('set_card_properties', {card_id: 10, properties: values});
  assert.deepEqual(harness.requests.at(-1)?.body, {properties: values});
  harness.reply({id: 8});
  await harness.call('update_checklist', {
    card_id: 10,
    checklist_id: 8,
    changes: {sort_order: 0},
  });
  assert.deepEqual(harness.requests.at(-1)?.body, {sort_order: 0});
  for (const changes of [
    {text: 'New'},
    {checked: false},
    {sort_order: 0},
    {due_date: null},
    {responsible_id: null},
  ]) {
    const result = await harness.call('update_checklist_item', {
      card_id: 10,
      checklist_id: 8,
      item_id: 9,
      changes,
    });
    assert.notEqual(result.isError, true);
    assert.deepEqual(harness.requests.at(-1)?.body, changes);
  }
});

test('upstream failures return sanitized errors without retrying writes', async context => {
  const harness = await startHarness(context);
  for (const status of [400, 401, 403, 404, 429, 500, 502, 503]) {
    harness.reply({message: `sensitive ${token}`}, status);
    const before = harness.requests.length;
    const result = await harness.call('create_card', {
      title: 'Task',
      board_id: 2,
    });
    assert.deepEqual(errorPayload(result), {
      code: 'KAITEN_HTTP_ERROR',
      message: `Kaiten returned HTTP ${status}.`,
      status,
    });
    assert.ok(!JSON.stringify(result).includes(token));
    assert.equal(harness.requests.length, before + 1);
  }
  harness.respond((_request, response) => {
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(`not-json-${token}`);
  });
  assert.equal(
    errorPayload(await harness.call('get_card', {card_id: 10})).code,
    'INVALID_KAITEN_RESPONSE',
  );
  harness.reply({unexpected: token});
  assert.equal(
    errorPayload(await harness.call('get_card', {card_id: 10})).code,
    'INVALID_KAITEN_RESPONSE',
  );
  harness.respond((_request, response) => response.destroy());
  const before = harness.requests.length;
  assert.equal(
    errorPayload(
      await harness.call('create_card', {title: 'Task', board_id: 2}),
    ).code,
    'NETWORK_ERROR',
  );
  assert.equal(harness.requests.length, before + 1);
  assert.ok(!harness.stderr.includes(token));
});

test('timeout aborts the outgoing HTTP request', async context => {
  const harness = await startHarness(context, 300);
  harness.respond(() => {});
  const received = once(harness.events, 'request', {
    signal: AbortSignal.timeout(5000),
  });
  const pending = harness.call('create_card', {title: 'Task', board_id: 2});
  const [, response] = (await received) as [unknown, ServerResponse];
  const closed = once(response, 'close', {signal: AbortSignal.timeout(5000)});
  assert.equal(errorPayload(await pending).code, 'TIMEOUT');
  await closed;
  assert.equal(harness.requests.length, 1);
});

test('client cancellation aborts the outgoing HTTP request', async context => {
  const harness = await startHarness(context);
  harness.respond(() => {});
  const controller = new AbortController();
  const received = once(harness.events, 'request', {
    signal: AbortSignal.timeout(5000),
  });
  const pending = harness.client.callTool(
    {name: 'kaiten_get_card', arguments: {card_id: 10}},
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

test('closing stdio aborts an in-flight request', async context => {
  const harness = await startHarness(context);
  harness.respond(() => {});
  const received = once(harness.events, 'request', {
    signal: AbortSignal.timeout(5000),
  });
  const pending = harness.call('get_card', {card_id: 10});
  const rejected = assert.rejects(pending);
  const [, response] = (await received) as [unknown, ServerResponse];
  const closed = once(response, 'close', {signal: AbortSignal.timeout(5000)});
  await harness.client.close();
  await rejected;
  await closed;
});
