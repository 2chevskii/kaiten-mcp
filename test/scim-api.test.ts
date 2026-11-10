import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness, token} from './harness.ts';

for (const resource of ['users', 'groups']) {
  test(`SCIM ${resource} iteration preserves one-based indices across capped pages`, async context => {
    const harness = await startHarness(context);
    harness.respond((request, response) => {
      const next = request.query.startIndex === '2';
      response.setHeader('Content-Type', 'application/json');
      response.end(
        JSON.stringify({
          Resources: [{id: next ? 2 : 1}],
          totalResults: 2,
          startIndex: 0,
          itemsPerPage: 1,
        }),
      );
    });
    const result = await harness.call(`scim.${resource}.iterate`, {
      count: 20,
      ...(resource === 'users' ? {filter: 'active eq true'} : {}),
    });
    assert.deepEqual(result.structuredContent, {
      result: {items: [{id: 1}, {id: 2}], truncated: false},
    });
    assert.deepEqual(
      harness.requests.map(request => request.query),
      [
        {
          count: '20',
          startIndex: '1',
          ...(resource === 'users' ? {filter: 'active eq true'} : {}),
        },
        {
          count: '20',
          startIndex: '2',
          ...(resource === 'users' ? {filter: 'active eq true'} : {}),
        },
      ],
    );
    assert.ok(
      harness.requests.every(
        request =>
          request.path ===
            `/scim/v2/${resource === 'users' ? 'Users' : 'Groups'}` &&
          request.authorization === `Bearer ${token}`,
      ),
    );
  });
}

test('SCIM validates typed patch paths and pagination before HTTP', async context => {
  const harness = await startHarness(context);
  for (const args of [
    {start_index: 0},
    {start_index: 1.5},
    {count: -1},
    {count: 0.5},
  ]) {
    assert.equal(
      (await harness.call('scim.users.getUsers', args)).isError,
      true,
    );
  }
  for (const operation of [
    {op: 'remove', path: 'active'},
    {op: 'replace', path: 'active', value: 'false'},
    {op: 'remove', path: 'name', value: null},
  ]) {
    assert.equal(
      (
        await harness.call('scim.users.updateUser', {
          user_id: 5,
          operations: [operation],
        })
      ).isError,
      true,
    );
  }
  assert.equal(
    (
      await harness.call('scim.groups.updateGroup', {
        group_id: 'group-id',
        operations: [{op: 'add', path: 'members', value: '5'}],
      })
    ).isError,
    true,
  );
  assert.equal(harness.requests.length, 0);
  for (const value of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(
      (
        await harness.call('scim.groups.updateGroup', {
          group_id: 'group-id',
          operations: [{op: 'add', path: 'members', value}],
        })
      ).isError,
      true,
    );
  }
  assert.equal(harness.requests.length, 0);
  harness.reply({id: 'opaque/group'});
  assert.notEqual(
    (await harness.call('scim.groups.getGroup', {group_id: 'opaque/group'}))
      .isError,
    true,
  );
  assert.equal(harness.requests.at(-1)?.path, '/scim/v2/Groups/opaque%2Fgroup');
});
