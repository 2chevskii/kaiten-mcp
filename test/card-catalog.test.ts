import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {CatalogDefinition} from '../src/catalog.ts';
import {cardsCatalog} from '../src/catalog/cards.ts';
import {collaborationCatalog} from '../src/catalog/collaboration.ts';
import {cardFixture, startHarness} from './harness.ts';

const canonical = {KAITEN_TOOL_PROFILE: 'canonical'};

function coveredSources(catalog: CatalogDefinition) {
  return new Set(
    Object.values(catalog).flatMap(tool =>
      Object.values(tool.operations).flatMap(routes => {
        const variants = 'source' in routes ? [routes] : routes;
        return variants.flatMap(route => [
          route.source,
          ...(route.replaces ?? []),
        ]);
      }),
    ),
  );
}

test('canonical card and collaboration operations cover their legacy routes', async context => {
  const legacy = await startHarness(context, 30_000, {
    KAITEN_TOOL_PROFILE: 'legacy',
  });
  const harness = await startHarness(context, 30_000, canonical);
  const domains = new Set([
    'cards',
    'comments',
    'external_links',
    'relations',
    'children',
  ]);
  const workflows = new Set([
    'cardTimeLogs.addTimeLog',
    'cardTimeLogs.getTimeLogs',
    'cardTimeLogs.removeTimeLog',
    'cardTimeLogs.updateLogRecord',
    'timesheet.getList',
    'cardSla.retrieveCardSlaMeasurements',
    'serviceDeskServices.retrieveServicesList',
    'cardServiceDeskExternalRecipients.addNewRecipient',
    'cardServiceDeskExternalRecipients.removeRecipient',
    'sendCardWebhook',
  ]);
  const sources = new Set([
    ...coveredSources(cardsCatalog),
    ...coveredSources(collaborationCatalog),
  ]);
  const expected = Array.from(legacy.operations)
    .filter(
      ([name, {tool}]) =>
        domains.has(tool.slice(7, tool.lastIndexOf('_'))) &&
        !workflows.has(name),
    )
    .map(([name]) => name);
  assert.deepEqual(
    [...sources].filter(name => !name.startsWith('catalog.')).sort(),
    expected.sort(),
  );

  const tools = (await harness.client.listTools()).tools.filter(tool =>
    /^kaiten_(?:cards|collaboration)_/.test(tool.name),
  );
  assert.equal(tools.length, 4);
  for (const tool of tools) {
    const variants = (
      tool.inputSchema.properties?.request as {
        anyOf: {
          properties: {
            operation: {const: string};
            args: {description?: string; anyOf?: {description?: string}[]};
          };
        }[];
      }
    ).anyOf;
    const operations = variants.map(
      variant => variant.properties.operation.const,
    );
    assert.equal(operations.length, new Set(operations).size);
    assert(operations.every(name => /^[a-z][a-z0-9_]+$/.test(name)));
    for (const variant of variants) {
      const args = variant.properties.args;
      assert((args.anyOf ?? [args]).every(form => form.description));
    }
    assert.equal(tool.annotations?.readOnlyHint, tool.name.endsWith('_read'));
    assert(tool.outputSchema);
  }
  assert.equal(
    harness.operations.get('list_card_children')?.tool,
    'kaiten_collaboration_read',
  );
  const allowedUsers = harness.operations.get(
    'list_allowed_card_users',
  )?.schema;
  assert.match(JSON.stringify(allowedUsers), /server defaults to 100/);
  const nativeSearch = harness.operations.get('search_cards')?.schema;
  assert.match(JSON.stringify(nativeSearch), /previous position/);
});

test('canonical card search chooses summary cursors or native pages', async context => {
  const harness = await startHarness(context, 30_000, canonical);
  harness.reply([cardFixture]);
  const page = await harness.call('search_cards', {
    responsible_ids: [5],
    limit: 1,
  });
  assert.equal(page.isError, undefined);
  assert.deepEqual(
    page.structuredContent &&
      Object.entries(page.structuredContent).find(
        ([key]) => key === 'next_cursor',
      ),
    ['next_cursor', 'offset:1'],
  );
  assert.equal(harness.requests.at(-1)?.query.version, '1');
  assert.equal(harness.requests.at(-1)?.query.responsible_ids, '5');

  const nextPage = await harness.call('search_cards', {
    responsible_ids: [5],
    limit: 1,
    cursor: 'offset:1',
  });
  assert.equal(nextPage.isError, undefined);
  assert.equal(harness.requests.at(-1)?.query.offset, '1');

  const native = {result: [cardFixture], position: 'next-native'};
  harness.reply(native);
  const nativePage = await harness.call('search_cards', {
    mode: 'native_page',
    query: {version: 2, start_position: 'previous-native'},
  });
  assert.equal(nativePage.isError, undefined);
  assert.deepEqual(nativePage.structuredContent, {result: native});
  assert.equal(
    harness.requests.at(-1)?.query.start_position,
    'previous-native',
  );
});

test('canonical card lifecycle preserves native fields and rejects an empty patch', async context => {
  const harness = await startHarness(context, 30_000, canonical);
  const fixture = {...cardFixture, external_id: 'crm-100'};
  harness.reply(fixture);
  const body = {
    title: 'New',
    board_id: 2,
    responsible_id: 3,
    external_id: 'crm-100',
  };
  const create = await harness.call('create_card', {body});
  assert.equal(create.isError, undefined);
  assert.deepEqual(create.structuredContent, {result: fixture});
  assert.deepEqual(harness.requests.at(-1)?.body, body);

  const count = harness.requests.length;
  assert.equal(
    (await harness.call('update_card', {card_id: 10, body: {}})).isError,
    true,
  );
  assert.equal(harness.requests.length, count);
  const patch = await harness.call('update_card', {
    card_id: 10,
    body: {description: null},
  });
  assert.equal(patch.isError, undefined);
  assert.deepEqual(harness.requests.at(-1)?.body, {description: null});

  const archive = await harness.call('archive_card', {card_id: 10});
  assert.equal(archive.isError, undefined);
  assert.equal(harness.requests.at(-1)?.method, 'PATCH');
  assert.deepEqual(harness.requests.at(-1)?.body, {condition: 2});
});

test('canonical batch updates require complete cell sort arguments', async context => {
  const harness = await startHarness(context, 30_000, canonical);
  const cell = {column_id: 3, lane_id: 4};
  for (const body of [
    {...cell, order_by: {}},
    {...cell, order_by: {field_type: 'title'}},
    {...cell, order_by: {direction: 'asc'}},
    {column_id: 3, order_by: {field_type: 'title', direction: 'asc'}},
    {attributes: {condition: 2}},
  ]) {
    const result = await harness.call('batch_update_cards', {body});
    assert.equal(result.isError, true);
  }
  assert.equal(harness.requests.length, 0);

  const job = {id: 'card-batch-job'};
  harness.reply(job);
  for (const body of [
    {...cell, order_by: {field_type: 'title', direction: 'asc'}},
    {board_id: 2, attributes: {condition: 2}},
  ]) {
    const result = await harness.call('batch_update_cards', {body});
    assert.equal(result.isError, undefined);
    assert.deepEqual(result.structuredContent, {result: job});
    const request = harness.requests.at(-1);
    assert.equal(request?.method, 'PATCH');
    assert.equal(request?.path, '/api/v1/cards');
    assert.deepEqual(request?.body, body);
  }
});

test('canonical comments use one operation for JSON or legacy multipart', async context => {
  const harness = await startHarness(context, 30_000, canonical);
  const comment = {
    id: 7,
    uid: 'comment-uid',
    text: 'With text',
    attachments: [],
  };
  harness.reply([comment]);
  const compact = await harness.call('list_comments', {card_id: 10, limit: 1});
  assert.equal(compact.isError, undefined);
  assert.deepEqual(
    compact.structuredContent &&
      Object.entries(compact.structuredContent).find(
        ([key]) => key === 'next_offset',
      ),
    ['next_offset', 1],
  );
  assert.deepEqual(harness.requests.at(-1)?.query, {limit: '1'});
  const full = await harness.call('list_comments', {
    card_id: 10,
    format: 'full',
  });
  assert.equal(full.isError, undefined);
  assert.deepEqual(full.structuredContent, {
    items: [comment],
    next_offset: null,
  });

  harness.reply(comment);
  const textComment = await harness.call('add_comment', {
    card_id: 10,
    text: 'With text',
  });
  assert.equal(textComment.isError, undefined);
  assert.deepEqual(textComment.structuredContent, {result: comment});
  assert.deepEqual(harness.requests.at(-1)?.body, {text: 'With text'});

  const form = [
    {name: 'text', value: 'With text'},
    {
      name: 'files[]',
      file: {
        filename: 'note.txt',
        mime_type: 'text/plain',
        data_base64: 'SGk=',
      },
    },
  ];
  const multipart = await harness.call('add_comment', {card_id: 10, form});
  assert.equal(multipart.isError, undefined);
  assert.deepEqual(harness.requests.at(-1)?.body, {
    parts: [form[0], {name: 'files[]', ...form[1]!.file}],
  });

  const count = harness.requests.length;
  assert.equal(
    (await harness.call('add_comment', {card_id: 10, text: 'With text', form}))
      .isError,
    true,
  );
  assert.equal(harness.requests.length, count);
});

test('canonical child and external link mutations preserve ID meanings', async context => {
  const harness = await startHarness(context, 30_000, canonical);
  harness.reply({id: 20});

  const removed = await harness.call('remove_card_child', {
    parent_card_id: 10,
    child_card_id: 20,
  });
  assert.equal(removed.isError, undefined);
  assert.equal(harness.requests.at(-1)?.path, '/api/v1/cards/10/children/20');
  assert.equal(harness.requests.at(-1)?.method, 'DELETE');

  const updated = await harness.call('update_card_external_link', {
    card_id: 10,
    link_id: 30,
    body: {description: null},
  });
  assert.equal(updated.isError, undefined);
  assert.equal(
    harness.requests.at(-1)?.path,
    '/api/v1/cards/10/external-links/30',
  );
  assert.deepEqual(harness.requests.at(-1)?.body, {description: null});
});
