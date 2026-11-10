import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';

for (const scope of ['Company', 'Space']) {
  test(`${scope} activity iteration follows opaque cursors, retains filters, and bounds snapshots`, async context => {
    const harness = await startHarness(context);
    const queries = [
      {cursor: 'start', author_id: '5', actions: 'card_created', limit: '1'},
      {cursor: 'next+/=', author_id: '5', actions: 'card_created', limit: '1'},
    ];
    harness.respond((request, response) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(
        JSON.stringify(
          request.query.cursor === 'start'
            ? {
                items: [{id: 'first', data: {preserved: false}}],
                limit: 1,
                next_cursor: 'next+/=',
              }
            : {items: [{id: 'second'}], limit: 1, next_cursor: null},
        ),
      );
    });
    const args = {
      ...(scope === 'Space' ? {space_id: 1} : {}),
      query: {cursor: 'start', author_id: 5, actions: 'card_created', limit: 1},
    };
    const result = await harness.call(`activity.iterate${scope}Activity`, args);
    assert.deepEqual(result.structuredContent, {
      result: {
        items: [{id: 'first', data: {preserved: false}}, {id: 'second'}],
        truncated: false,
      },
    });
    assert.deepEqual(
      harness.requests.map(request => request.query),
      queries,
    );
    assert.ok(
      harness.requests.every(
        request =>
          request.path ===
          (scope === 'Space'
            ? '/api/v1/spaces/1/activity'
            : '/api/v1/company/activity'),
      ),
    );
    const bounded = await harness.call(`activity.iterate${scope}Activity`, {
      ...args,
      max_items: 1,
    });
    assert.deepEqual(bounded.structuredContent, {
      result: {
        items: [{id: 'first', data: {preserved: false}}],
        truncated: true,
      },
    });
    assert.equal(harness.requests.length, 4);
  });
}

test('activity iterator rejects repeated cursors and malformed pages without looping', async context => {
  const harness = await startHarness(context);
  for (const page of [
    {items: [], next_cursor: 'same'},
    {items: {}, next_cursor: null},
    {items: [], next_cursor: 42},
  ]) {
    harness.reply(page);
    assert.equal(
      (
        await harness.call('activity.iterateCompanyActivity', {
          query: {cursor: 'same'},
        })
      ).isError,
      true,
    );
  }
  assert.equal(harness.requests.length, 3);
});

test('activity and audit filters reject invalid paging and unknown fields before HTTP', async context => {
  const harness = await startHarness(context);
  for (const [name, args] of [
    ['activity.listSpaceActivity', {space_id: 1, query: {card_id: 10}}],
    ['activity.listCompanyActivity', {query: {limit: 0}}],
    ['activity.iterateCompanyActivity', {max_items: 1001}],
    ['auditLogs.retrieveAuditLogEvents', {query: {offset: 0.5}}],
    ['auditLogs.retrieveAuditLogEvents', {query: {categories: []}}],
  ] as const)
    assert.equal((await harness.call(name, args)).isError, true);
  assert.equal(harness.requests.length, 0);
});
