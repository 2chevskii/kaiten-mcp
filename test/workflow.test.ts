import assert from 'node:assert/strict';
import {test} from 'node:test';
import {cardFixture, startHarness} from './harness.ts';

test('complete card workflow through stdio retains state between operations', async context => {
  const harness = await startHarness(context);
  let card: Record<string, unknown> | undefined;
  const comments: Record<string, unknown>[] = [];
  const members: Record<string, unknown>[] = [];
  const tags: Record<string, unknown>[] = [];
  const items: Record<string, unknown>[] = [];
  const checklists: Record<string, unknown>[] = [];
  harness.respond((request, response) => {
    const body = request.body as Record<string, unknown>;
    let result: unknown;
    const {method, path} = request;
    if (path === '/api/v1/spaces/1/boards' && method === 'GET') {
      result = [{id: 2, title: 'Work'}];
    } else if (path === '/api/v1/cards' && method === 'POST') {
      assert.equal(card, undefined);
      card = {...cardFixture, ...body, comments, members, tags, checklists};
      result = card;
    } else if (path === '/api/v1/cards/10' && method === 'PATCH') {
      assert.ok(card);
      card = {...card, ...body};
      if (body.condition !== undefined) card.archived = body.condition === 2;
      result = card;
    } else if (path === '/api/v1/cards/10' && method === 'GET') {
      assert.ok(card);
      result = card;
    } else if (path === '/api/v1/cards/10' && method === 'DELETE') {
      assert.ok(card);
      result = card;
      card = undefined;
    } else if (path === '/api/v1/cards/10/comments' && method === 'POST') {
      result = {id: 6, ...body};
      comments.push(result as Record<string, unknown>);
    } else if (path === '/api/v1/cards/10/members' && method === 'POST') {
      result = {id: 9, ...body};
      members.push(result as Record<string, unknown>);
    } else if (path === '/api/v1/cards/10/tags' && method === 'POST') {
      result = {id: 11, ...body};
      tags.push(result as Record<string, unknown>);
    } else if (path === '/api/v1/cards/10/checklists' && method === 'POST') {
      result = {id: 8, ...body, items};
      checklists.push(result as Record<string, unknown>);
    } else if (
      path === '/api/v1/cards/10/checklists/8/items' &&
      method === 'POST'
    ) {
      result = {id: 13, ...body};
      items.push(result as Record<string, unknown>);
    } else {
      response.writeHead(404);
      response.end();
      return;
    }
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(result));
  });
  async function call(name: string, args: Record<string, unknown>) {
    const result = await harness.call(name, args);
    assert.notEqual(result.isError, true, JSON.stringify(result));
    return result.structuredContent;
  }
  assert.deepEqual(await call('list_boards', {space_id: 1}), {
    items: [{id: 2, title: 'Work'}],
    next_offset: null,
  });
  await call('create_card', {board_id: 2, title: 'New task'});
  await call('update_card', {
    card_id: 10,
    changes: {description: 'Task details'},
  });
  await call('move_card', {
    card_id: 10,
    board_id: 2,
    column_id: 30,
    lane_id: 40,
  });
  await call('add_comment', {card_id: 10, text: 'Working on this'});
  await call('add_card_member', {card_id: 10, user_id: 5});
  await call('add_card_tag', {card_id: 10, name: 'Ready'});
  await call('create_checklist', {card_id: 10, name: 'Delivery'});
  await call('add_checklist_item', {
    card_id: 10,
    checklist_id: 8,
    text: 'Implement',
    checked: true,
  });
  await call('set_card_properties', {card_id: 10, properties: {id_7: [14]}});
  await call('archive_card', {card_id: 10});
  assert.equal(card?.archived, true);
  await call('restore_card', {card_id: 10});
  assert.equal(card?.archived, false);
  const result = (await call('get_card', {card_id: 10})) as {
    item: Record<string, unknown>;
  };
  assert.equal(result.item.title, 'New task');
  assert.equal(result.item.description, 'Task details');
  assert.equal(result.item.column_id, 30);
  assert.deepEqual(result.item.properties, {id_7: [14]});
  assert.deepEqual(result.item.members, [{id: 9, user_id: 5}]);
  assert.deepEqual(result.item.tags, [{id: 11, name: 'Ready'}]);
  assert.deepEqual(result.item.checklists, [{id: 8, name: 'Delivery'}]);
  assert.deepEqual(comments, [{id: 6, text: 'Working on this'}]);
  assert.deepEqual(items, [{id: 13, text: 'Implement', checked: true}]);
  await call('delete_card', {card_id: 10});
  assert.equal(card, undefined);
  assert.equal(harness.requests.length, 14);
});
