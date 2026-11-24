import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness, token} from './harness.ts';

test('workflow reads locate iterations and memberships using public REST paging', async context => {
  const harness = await startHarness(context, 30_000, {
    KAITEN_TOOL_PROFILE: 'canonical',
  });
  const iteration = {
    id: 'iteration-uid',
    space_uid: 'space-uid',
    status: 'active',
  };
  harness.reply([iteration]);
  assert.equal(
    harness.operations.get('list_iterations')?.tool,
    'kaiten_workflows_read',
  );
  const page = await harness.call('list_iterations', {
    space_uid: 'space-uid',
    query: {status: 'active', limit: 10, offset: 20, order: 'desc'},
  });
  assert.deepEqual(page.structuredContent, {result: [iteration]});
  assert.deepEqual(harness.requests[0], {
    method: 'GET',
    path: '/api/v1/spaces/space-uid/iterations',
    query: {status: 'active', limit: '10', offset: '20', order: 'desc'},
    body: undefined,
    authorization: 'Bearer ' + token,
  });
  const rejected = await harness.call('list_iterations', {
    space_uid: 'space-uid',
    query: {with_data: 'cards'},
  });
  assert.equal(rejected.isError, true);
  assert.equal(harness.requests.length, 1);

  harness.reply([{card_id: 10, card_uid: 'card-uid'}]);
  const members = await harness.call('list_iteration_memberships', {
    space_uid: 'space-uid',
    iteration_id: 'iteration-uid',
    status: 'active',
  });
  assert.deepEqual(members.structuredContent, {
    result: [{card_id: 10, card_uid: 'card-uid'}],
  });
  assert.match(
    harness.requests.at(-1)!.path,
    /\/iterations\/iteration-uid\/cards$/,
  );
});

test('workflow writes preserve time-log values and webhook credential separation', async context => {
  const harness = await startHarness(context, 30_000, {
    KAITEN_TOOL_PROFILE: 'canonical',
  });
  assert.equal(
    harness.operations.get('add_card_time_log')?.tool,
    'kaiten_workflows_write',
  );
  const timeLog = {
    role_id: -1,
    time_spent: 60,
    for_date: '2026-11-24',
    comment: '',
  };
  harness.reply({id: 8, ...timeLog});
  const result = await harness.call('add_card_time_log', {
    card_id: 10,
    body: timeLog,
  });
  assert.deepEqual(result.structuredContent, {result: {id: 8, ...timeLog}});
  assert.deepEqual(harness.requests[0]?.body, timeLog);

  harness.reply({id: 11, title: 'Integration task'});
  const webhook = await harness.call('send_card_webhook', {
    webhook_url: harness.origin + '/fixture-webhook',
    body: {title: 'Integration task', asap: false},
  });
  assert.deepEqual(webhook.structuredContent, {
    result: {id: 11, title: 'Integration task'},
  });
  assert.equal(harness.requests[1]?.path, '/fixture-webhook');
  assert.equal(harness.requests[1]?.authorization, undefined);
});
