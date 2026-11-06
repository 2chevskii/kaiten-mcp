import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';

test('time tracking validates dates, roles, bounds and nonempty changes', async context => {
  const harness = await startHarness(context);
  for (const body of [
    {},
    {role_id: -2},
    {for_date: '2026-02-30'},
    {for_date: '2026-11-06T12:00:00Z'},
  ]) {
    assert.equal(
      (
        await harness.call('cardTimeLogs.updateLogRecord', {
          card_id: 10,
          time_log_id: 9,
          body,
        })
      ).isError,
      true,
    );
  }
  for (const query of [
    {},
    {from: '2026-11-01', to: 'invalid'},
    {from: '2026-11-01', to: '2026-11-06', limit: 201},
  ]) {
    assert.equal(
      (await harness.call('timesheet.getList', {query})).isError,
      true,
    );
  }
  assert.equal(harness.requests.length, 0);
});

test('time reporting preserves aggregate JSON and the built-in Employee role', async context => {
  const harness = await startHarness(context);
  harness.reply({total: 60, distribution: {'2026-11-06': 60}});
  const report = await harness.call('timesheet.getList', {
    query: {from: '2026-11-01', to: '2026-11-06', only_general_sum: 1},
  });
  assert.deepEqual(report.structuredContent, {
    result: {total: 60, distribution: {'2026-11-06': 60}},
  });
  harness.reply({id: -1, name: 'Employee'});
  assert.deepEqual(
    (await harness.call('userRoles.getUserRole', {role_id: -1}))
      .structuredContent,
    {result: {id: -1, name: 'Employee'}},
  );
  assert.equal(harness.requests.at(-1)?.path, '/api/v1/user-roles/-1');
  assert.notEqual(
    (
      await harness.call('userRoles.removeUserRole', {
        role_id: 7,
        replace_role_id: -1,
      })
    ).isError,
    true,
  );
  assert.deepEqual(harness.requests.at(-1)?.body, {replace_role_id: -1});
});
