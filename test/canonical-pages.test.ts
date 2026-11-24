import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';

test('canonical card relationships and time logs continue the same upstream query', async context => {
  const harness = await startHarness(context, 30_000, {
    KAITEN_TOOL_PROFILE: 'canonical',
  });
  const records = [1, 2, 3].map(id => ({
    id,
    uid: `record-${id}`,
    native: {retained: true},
  }));
  const summary = {total_blocked: 3};
  const cases = [
    {
      name: 'list_comments',
      path: '/cards/10/comments',
      args: {card_id: 10, format: 'full'},
      query: {},
      output: 'items',
    },
    {
      name: 'list_card_children',
      path: '/cards/10/children',
      args: {parent_card_id: 10, format: 'full', broken_api: false},
      query: {broken_api: 'false'},
      output: 'items',
    },
    {
      name: 'list_card_blockers',
      path: '/cards/10/blockers',
      args: {card_id: 10, broken_api: true},
      query: {broken_api: 'true'},
      output: 'result',
    },
    {
      name: 'list_my_blocked_cards',
      path: '/users/current/blockers',
      args: {},
      query: {},
      output: 'result',
      blockedSummary: true,
    },
    {
      name: 'list_card_time_logs',
      path: '/cards/10/time-logs',
      args: {card_id: 10, for_date: '2026-11-06', personal: false},
      query: {for_date: '2026-11-06', personal: 'false'},
      output: 'result',
    },
  ] as const;

  for (const entry of cases) {
    await context.test(entry.name, async () => {
      const expect = (items: typeof records, next_offset: number | null) => ({
        [entry.output]:
          'blockedSummary' in entry ? {blocked_cards: items, summary} : items,
        next_offset,
      });
      harness.respond((request, response) => {
        const start = Number(request.query.offset ?? 0);
        const limit = Number(request.query.limit ?? 100);
        const items = records.slice(start, start + limit);
        const body =
          'blockedSummary' in entry ? {blocked_cards: items, summary} : items;
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(body));
      });

      const omitted = await harness.call(entry.name, entry.args);
      assert.equal(omitted.isError, undefined);
      assert.deepEqual(omitted.structuredContent, expect(records, null));
      assert.deepEqual(harness.requests.at(-1)?.query, entry.query);
      assert.equal(harness.requests.at(-1)?.path, '/api/v1' + entry.path);

      const first = await harness.call(entry.name, {...entry.args, limit: 2});
      assert.equal(first.isError, undefined);
      assert.deepEqual(first.structuredContent, expect(records.slice(0, 2), 2));
      assert.deepEqual(harness.requests.at(-1)?.query, {
        ...entry.query,
        limit: '2',
      });

      const second = await harness.call(entry.name, {
        ...entry.args,
        limit: 2,
        offset: 2,
      });
      assert.equal(second.isError, undefined);
      assert.deepEqual(
        second.structuredContent,
        expect(records.slice(2), null),
      );
      assert.deepEqual(harness.requests.at(-1)?.query, {
        ...entry.query,
        limit: '2',
        offset: '2',
      });

      const count = harness.requests.length;
      const invalid = await harness.call(entry.name, {
        ...entry.args,
        limit: 101,
      });
      assert.equal(invalid.isError, true);
      assert.equal(harness.requests.length, count);
    });
  }
});

test('legacy reads retain local slices and canonical-only sources are hidden', async context => {
  const harness = await startHarness(context, 30_000, {
    KAITEN_TOOL_PROFILE: 'legacy',
  });
  const listed = (await harness.client.listTools()).tools;
  assert.equal(listed.length, 20);
  assert.doesNotMatch(JSON.stringify(listed), /catalog\.list/);
  assert.equal(harness.operations.has('catalog.listComments'), false);

  const fixture = [
    {id: 7, text: 'First'},
    {id: 8, text: 'Next', uid: 'comment-uid'},
  ];
  harness.reply(fixture);
  assert.deepEqual(
    (await harness.call('list_comments', {card_id: 10, limit: 1, offset: 1}))
      .structuredContent,
    {items: [{id: 8, text: 'Next'}], next_offset: null},
  );
  assert.deepEqual(harness.requests.at(-1)?.query, {});
  assert.deepEqual(
    (await harness.call('cardComments.retrieveCardComments', {card_id: 10}))
      .structuredContent,
    {result: fixture},
  );
  assert.deepEqual(harness.requests.at(-1)?.query, {});
  const count = harness.requests.length;
  const undeclaredSource = await harness.client.callTool({
    name: 'kaiten_comments_read',
    arguments: {
      request: {operation: 'catalog.listComments', args: {card_id: 10}},
    },
  });
  assert.equal(undeclaredSource.isError, true);
  assert.equal(harness.requests.length, count);
});
