import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {CatalogRoute} from '../src/catalog.ts';
import {workspaceCatalog} from '../src/catalog/workspace.ts';
import {activityCases} from './activity-cases.ts';
import {startHarness, token} from './harness.ts';
import {identityCases} from './identity-cases.ts';
import {scimCases} from './scim-cases.ts';
import {taxonomyCases} from './taxonomy-cases.ts';
import {toolCases} from './tool-cases.ts';
import {workspaceCases} from './workspace-cases.ts';

const routes = new Map<string, {tool: string; operation: string}>();
for (const [group, definition] of Object.entries(workspaceCatalog)) {
  for (const [operation, forms] of Object.entries(definition.operations)) {
    const branches: readonly CatalogRoute[] =
      'source' in forms ? [forms] : forms;
    for (const route of branches) {
      assert.ok(!routes.has(route.source), route.source);
      routes.set(route.source, {tool: `kaiten_${group}`, operation});
    }
  }
}

const nativeFormats = new Set([
  'boards.getBoard',
  'cardTypes.getListOfCardTypes',
  'columns.getListOfColumns',
  'companyUsers.getListOfUsers',
  'lanes.getListOfLanes',
  'spaceBoards.getListOfBoards',
  'spaces.retrieveListOfSpaces',
  'spaces.retrieveSpace',
  'tags.retrieveListOfTags',
  'users.retrieveCurrentUser',
]);

test('canonical workspace variants preserve workspace and access HTTP contracts', async context => {
  const harness = await startHarness(context, 30_000, {
    KAITEN_TOOL_PROFILE: 'canonical',
  });
  const advanced = [
    ...workspaceCases,
    ...identityCases,
    ...scimCases,
    ...taxonomyCases,
    ...activityCases,
  ];
  const cases = [
    ...toolCases.filter(item => routes.has(item.name)),
    ...advanced,
  ];
  for (const item of cases) {
    await context.test(item.name, async () => {
      const route = routes.get(item.name);
      assert.ok(route, `Missing workspace route for ${item.name}`);
      assert.equal(harness.operations.get(route.operation)?.tool, route.tool);
      const args = {...item.args};
      if (nativeFormats.has(item.name)) args['format'] = 'native';
      if (item.name === 'spaceBoards.getBoard') {
        args['board_id'] = args['id'];
        delete args['id'];
      }

      harness.reply(item.response, item.status);
      const count = harness.requests.length;
      const result = await harness.call(route.operation, args);
      assert.notEqual(result.isError, true, JSON.stringify(result));
      if (advanced.includes(item)) {
        assert.deepEqual(result.structuredContent, {result: item.response});
      }
      assert.equal(harness.requests.length, count + 1);
      assert.deepEqual(harness.requests.at(-1), {
        method: item.method,
        path: `${item.api_prefix ?? '/api/v1'}${item.path}`,
        query: item.query ?? {},
        body: item.body,
        authorization: `Bearer ${token}`,
      });
    });
  }
});

test('workspace advertises a single intent for each legacy alternative and documents scope and side effects', async context => {
  const canonical = await startHarness(context, 30_000, {
    KAITEN_TOOL_PROFILE: 'canonical',
  });
  const legacy = await startHarness(context, 30_000, {
    KAITEN_TOOL_PROFILE: 'legacy',
  });
  const reassigned = /^(?:automations|iterations|sprints)\./;
  const workspaceSources = [...legacy.operations]
    .filter(
      ([name, entry]) =>
        entry.tool.startsWith('kaiten_navigation_') && !reassigned.test(name),
    )
    .map(([name]) => name);
  assert.deepEqual([...routes.keys()].sort(), workspaceSources.sort());
  for (const [source, canonicalRoute] of routes) {
    const operation = canonical.operations.get(canonicalRoute.operation);
    assert.equal(operation?.tool, canonicalRoute.tool);
    if (source !== canonicalRoute.operation) {
      assert.notEqual(
        canonical.operations.get(source)?.tool,
        canonicalRoute.tool,
      );
    }
  }
  const deleteColumn = canonical.operations.get('delete_column')?.schema;
  assert.match(
    JSON.stringify(deleteColumn),
    /cascade deletion to related data/,
  );
  const removeRole = canonical.operations.get('delete_user_role')?.schema;
  assert.match(JSON.stringify(removeRole), /of the role to delete/);
  assert.match(JSON.stringify(removeRole), /in place of the deleted role/);
  const getBoard = canonical.operations.get('get_board')?.schema;
  assert.match(
    JSON.stringify(getBoard),
    /verify a board belongs to that space/,
  );
  const tools = (await canonical.client.listTools()).tools.filter(tool =>
    tool.name.startsWith('kaiten_workspace_'),
  );
  assert.equal(tools.length, 2);
  assert.ok(
    tools.every(tool => !tool.description?.includes('full API fields')),
  );
});

test('canonical workspace validates scope and exposes bounded activity snapshots and OAuth prerequisites', async context => {
  const harness = await startHarness(context, 30_000, {
    KAITEN_TOOL_PROFILE: 'canonical',
  });

  const wrongScope = await harness.call('get_board', {
    space_id: 1,
    id: 2,
  });
  assert.equal(wrongScope.isError, true);

  const incompatibleFilters = await harness.call('list_activity', {
    space_id: 1,
    query: {card_id: 10},
  });
  assert.equal(incompatibleFilters.isError, true);

  const missingSecret = await harness.call('get_addon_token', {
    addon_uid: 'fixture-addon',
    user_id: 5,
    company_id: 6,
  });
  assert.equal(missingSecret.isError, true);
  assert.match(JSON.stringify(missingSecret.content), /CONFIGURATION_ERROR/);
  assert.equal(harness.requests.length, 0);

  harness.respond((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.end(
      JSON.stringify(
        request.query.cursor
          ? {items: [{id: 'next'}], limit: 1, next_cursor: null}
          : {items: [{id: 'first'}], limit: 1, next_cursor: 'next+/='},
      ),
    );
  });
  const snapshot = await harness.call('scan_activity', {
    space_id: 1,
    query: {author_id: 5, limit: 1},
    max_items: 1,
  });
  assert.deepEqual(snapshot.structuredContent, {
    result: {items: [{id: 'first'}], truncated: true},
  });
  assert.deepEqual(
    harness.requests.map(request => request.path),
    ['/api/v1/spaces/1/activity', '/api/v1/spaces/1/activity'],
  );
  assert.deepEqual(harness.requests.at(-1)?.query, {
    author_id: '5',
    cursor: 'next+/=',
    limit: '1',
  });
});
