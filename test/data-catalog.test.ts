import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {CatalogRoute} from '../src/catalog.ts';
import {checklistsCatalog} from '../src/catalog/checklists.ts';
import {customPropertiesCatalog} from '../src/catalog/custom-properties.ts';
import {checklistApiCases} from './checklist-api-cases.ts';
import {directoryCases} from './directory-cases.ts';
import {cardFixture, startHarness, token} from './harness.ts';
import {propertyCases} from './property-cases.ts';
import {toolCases} from './tool-cases.ts';

const routes = new Map<string, {tool: string; operation: string}>();
for (const [tool, definition] of Object.entries({
  ...checklistsCatalog,
  ...customPropertiesCatalog,
})) {
  for (const [operation, forms] of Object.entries(definition.operations)) {
    const branches: readonly CatalogRoute[] =
      'source' in forms ? [forms] : forms;
    for (const {source} of branches) {
      assert.ok(!routes.has(source), source);
      routes.set(source, {tool: `kaiten_${tool}`, operation});
    }
  }
}

const nativeFormats = new Set([
  'cardChecklists.removeChecklistFromCard',
  'cardChecklists.retrieveCardChecklist',
  'cardChecklistItems.removeChecklistItem',
  'customProperties.getListOfProperties',
  'customProperties.getProperty',
  'customPropertySelectValues.getListOfSelectValues',
  'customPropertyCatalogValues.getListOfCatalogValues',
  'customDirectories.getListOfCustomDirectories',
  'customDirectoryRecords.getListOfRecords',
]);

function canonicalHarness(context: Parameters<typeof startHarness>[0]) {
  return startHarness(context, 30_000, {KAITEN_TOOL_PROFILE: 'canonical'});
}

test('canonical checklist, custom property and directory branches preserve their HTTP contracts', async context => {
  const harness = await canonicalHarness(context);
  const advanced = [...checklistApiCases, ...directoryCases, ...propertyCases];
  const cases = [
    ...toolCases.filter(item => routes.has(item.name)),
    ...advanced,
  ];
  for (const item of cases) {
    await context.test(item.name, async () => {
      const route = routes.get(item.name);
      assert.ok(route, `Missing canonical route for ${item.name}`);
      assert.equal(harness.operations.get(route.operation)?.tool, route.tool);
      const args = nativeFormats.has(item.name)
        ? {...item.args, format: 'native'}
        : item.args;
      harness.reply(item.response, item.status);
      const previousRequests = harness.requests.length;
      const result = await harness.call(route.operation, args);
      assert.notEqual(result.isError, true, JSON.stringify(result));
      if (advanced.includes(item)) {
        assert.deepEqual(result.structuredContent, {result: item.response});
      }
      assert.equal(harness.requests.length, previousRequests + 1);
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

test('canonical checklist references preserve nullable and omitted template IDs', async context => {
  const harness = await canonicalHarness(context);
  const manual = {id: 8, name: 'Manual', checklist_id: null};
  const checklists = [
    manual,
    {id: 9, name: 'From template', checklist_id: 42},
    {id: 10, name: 'Without reference field'},
  ];
  harness.reply({...cardFixture, checklists});

  const page = await harness.call('list_checklists', {card_id: 10});
  assert.notEqual(page.isError, true, JSON.stringify(page));
  assert.deepEqual(page.structuredContent, {
    items: checklists,
    next_offset: null,
  });

  const card = await harness.call('get_card', {card_id: 10});
  assert.deepEqual(card.structuredContent, {
    item: {...cardFixture, checklists},
  });

  const checklist = {
    ...manual,
    items: [{id: 6, checklist_id: 8, text: 'Read me'}],
  };
  harness.reply(checklist);
  const details = await harness.call('get_checklist', {
    card_id: 10,
    checklist_id: manual.id,
  });
  assert.deepEqual(details.structuredContent, {item: checklist});
  assert.deepEqual(
    harness.requests.map(({method, path}) => `${method} ${path}`),
    [
      'GET /api/v1/cards/10',
      'GET /api/v1/cards/10',
      'GET /api/v1/cards/10/checklists/8',
    ],
  );

  const {tools} = await harness.client.listTools();
  const output = tools.find(
    tool => tool.name === 'kaiten_checklists_read',
  )?.outputSchema;
  const variants = output?.anyOf as
    | Array<{
        properties: {
          items?: {
            items: {
              properties: {checklist_id: {type: string | string[]}};
              required: string[];
            };
          };
        };
      }>
    | undefined;
  const reference = variants?.find(variant => variant.properties.items)
    ?.properties.items?.items;
  assert.ok(reference);
  assert.deepEqual(reference.properties.checklist_id.type, ['number', 'null']);
  assert.ok(!reference.required.includes('checklist_id'));
});

test('the canonical data catalog maps every legacy operation and advertises its choice semantics', async context => {
  const canonical = await canonicalHarness(context);
  const legacy = await startHarness(context, 30_000, {
    KAITEN_TOOL_PROFILE: 'legacy',
  });
  const legacySources = [...legacy.operations]
    .filter(([, entry]) =>
      /^kaiten_(checklists|custom_properties)_/.test(entry.tool),
    )
    .map(([source]) => source);
  assert.deepEqual([...routes.keys()].sort(), legacySources.sort());
  for (const [source, canonicalRoute] of routes) {
    assert.equal(
      canonical.operations.get(canonicalRoute.operation)?.tool,
      canonicalRoute.tool,
    );
    if (source !== canonicalRoute.operation)
      assert.ok(!canonical.operations.has(source), source);
  }
  const operations = canonical.operations;
  assert.match(
    JSON.stringify(operations.get('create_checklist')?.schema),
    /copy items from/,
  );
  assert.match(
    JSON.stringify(operations.get('delete_checklist_template')?.schema),
    /String template UID/,
  );
  assert.match(
    JSON.stringify(operations.get('list_custom_directory_records')?.schema),
    /type-compatible operation/,
  );
  assert.match(
    JSON.stringify(operations.get('update_custom_directory')?.schema),
    /Omitted fields are soft-deleted/,
  );
  const directoryPatch = operations.get('update_custom_directory')?.schema
    .properties as {body: {dependentRequired: unknown}};
  assert.deepEqual(directoryPatch.body.dependentRequired, {
    expected_field_ids: ['fields'],
  });
  assert.match(
    JSON.stringify(operations.get('set_card_properties')?.schema),
    /directory record UUID arrays/,
  );
});

test('incompatible scopes and invalid nested inputs are rejected before any HTTP request', async context => {
  const harness = await canonicalHarness(context);
  for (const [operation, args] of [
    ['create_checklist', {card_id: 10, body: {exclude_item_ids: [9]}}],
    [
      'update_checklist_item',
      {card_id: 10, checklist_id: 8, item_id: 9, changes: {}},
    ],
    ['get_checklist', {card_id: 10, checklist_id: 8, format: 'invalid'}],
    [
      'delete_checklist_template',
      {space_uid: 'space-uid', template_checklist_uid: 8},
    ],
    ['set_card_properties', {card_id: 10, properties: {name: 'test'}}],
    [
      'update_custom_directory',
      {
        directory_id: '12345678-1234-4234-8234-123456789abc',
        body: {expected_field_ids: []},
      },
    ],
    [
      'update_collective_vote',
      {card_id: 10, property_id: 7, id: 5, number_vote: '2'},
    ],
  ] as const) {
    const result = await harness.call(operation, args);
    assert.equal(result.isError, true, operation);
  }
  assert.equal(harness.requests.length, 0);
});
