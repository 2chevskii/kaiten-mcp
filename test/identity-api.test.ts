import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';

test('identity changes validate enums and required change combinations', async context => {
  const harness = await startHarness(context);
  for (const body of [
    {},
    {old_password: 'fixture-only'},
    {theme: 'invalid'},
    {notification_enabled_channels: ['unknown']},
  ]) {
    assert.equal(
      (await harness.call('users.updateUser', {user_id: 5, body})).isError,
      true,
    );
  }
  for (const body of [{}, {notifications_enabled: true}]) {
    assert.equal(
      (
        await harness.call('spaceUsers.changeUserRoleAndNotificationSettings', {
          space_id: 1,
          id: 5,
          body,
        })
      ).isError,
      true,
    );
  }
  assert.equal(harness.requests.length, 0);
});

test('user iteration advances offsets while preserving query flags', async context => {
  const harness = await startHarness(context);
  harness.respond((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.end(
      JSON.stringify(
        request.query.offset === '0'
          ? [{id: 5}, {id: 6}]
          : request.query.offset === '2'
            ? [{id: 7}]
            : [],
      ),
    );
  });
  const result = await harness.call('users.iterate', {
    query: {limit: 2, ids: [5, 6, 7], include_inactive: false},
  });
  assert.deepEqual(result.structuredContent, {
    result: {items: [{id: 5}, {id: 6}, {id: 7}], truncated: false},
  });
  assert.deepEqual(
    harness.requests.map(request => request.query),
    [
      {limit: '2', ids: '5,6,7', include_inactive: 'false', offset: '0'},
      {limit: '2', ids: '5,6,7', include_inactive: 'false', offset: '2'},
      {limit: '2', ids: '5,6,7', include_inactive: 'false', offset: '3'},
    ],
  );
});
