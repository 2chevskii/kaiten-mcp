import assert from 'node:assert/strict';
import {test} from 'node:test';
import {contentCatalog} from '../src/catalog/content.ts';
import {richDocument} from './document-cases.ts';
import {cardUid, commentUid, fileUid, propertyUid} from './file-cases.ts';
import {startHarness} from './harness.ts';

const canonical = {KAITEN_TOOL_PROFILE: 'canonical'};

test('canonical content covers all legacy documents and attachments', async context => {
  const legacy = await startHarness(context, 30_000, {
    KAITEN_TOOL_PROFILE: 'legacy',
  });
  const harness = await startHarness(context, 30_000, canonical);
  const domains = new Set(['documents', 'files']);
  const expected = Array.from(legacy.operations)
    .filter(([, {tool}]) => domains.has(tool.slice(7, tool.lastIndexOf('_'))))
    .map(([name]) => name);
  const definitions = Object.values(contentCatalog);
  const sources = definitions.flatMap(tool =>
    Object.values(tool.operations).flatMap(routes =>
      ('source' in routes ? [routes] : routes).map(route => route.source),
    ),
  );
  const explicitSchemaSource = 'documents.updateDocumentWithSchema';
  assert.ok(!legacy.operations.has(explicitSchemaSource));
  assert.deepEqual(sources.sort(), [...expected, explicitSchemaSource].sort());

  const tools = (await harness.client.listTools()).tools.filter(tool =>
    tool.name.startsWith('kaiten_content_'),
  );
  assert.equal(tools.length, 2);
  for (const tool of tools) {
    assert.equal(tool.annotations?.readOnlyHint, tool.name.endsWith('_read'));
    assert.ok(tool.outputSchema);
  }
  const metadata = JSON.stringify(
    harness.operations.get('get_attachment')?.schema,
  );
  assert.match(metadata, /short-lived URL/);
  assert.match(metadata, /attachment disposition/);
  assert.match(metadata, /legacy_card/);
  assert.match(
    JSON.stringify(harness.operations.get('update_document')?.schema),
    /Replacement ProseMirror document tree/,
  );
});

test('canonical document search and edits retain versioned page and body semantics', async context => {
  const harness = await startHarness(context, 30_000, canonical);
  const doc = {uid: 'doc-uid', title: 'Spec', data: richDocument};
  const page = {result: [doc], position: 'next'};
  harness.reply(page);
  const list = await harness.call('list_documents', {
    query: {
      version: 2,
      start_position: 'previous',
      include_search_preview: false,
    },
  });
  assert.equal(list.isError, undefined);
  assert.deepEqual(list.structuredContent, {result: page});
  assert.deepEqual(harness.requests.at(-1)?.query, {
    version: '2',
    start_position: 'previous',
    include_search_preview: 'false',
  });

  harness.reply(doc);
  const body = {data: richDocument, parent_entity_uid: null, public: false};
  const update = await harness.call('update_document', {
    document_uid: doc.uid,
    body,
  });
  assert.equal(update.isError, undefined);
  assert.deepEqual(update.structuredContent, {result: doc});
  assert.equal(harness.requests.at(-1)?.path, '/api/v1/documents/doc-uid');
  assert.deepEqual(harness.requests.at(-1)?.body, body);
});

test('canonical attachment routes preserve parent scope and meaningful false flags', async context => {
  const harness = await startHarness(context, 30_000, canonical);
  const body = {name: 'renamed.txt', card_cover: false};
  const file = {
    id: fileUid,
    card_cover: false,
    name: 'original.txt',
    native: {key: 'retained'},
  };
  const cases = [
    {target: 'card', args: {card_uid: cardUid}, scope: ''},
    {
      target: 'comment',
      args: {card_uid: cardUid, comment_uid: commentUid},
      scope: `/comments/${commentUid}`,
    },
    {
      target: 'property',
      args: {card_uid: cardUid, property_uid: propertyUid},
      scope: `/custom-properties/${propertyUid}`,
    },
  ];
  for (const {target, args, scope} of cases) {
    const route = {target, ...args, file_uid: fileUid};
    const path = `/api/v1/cards/${cardUid}${scope}/files/${fileUid}`;
    harness.reply(file);
    const result = await harness.call('get_attachment', {
      ...route,
      query: {redirect: false, download: true},
    });
    assert.equal(result.isError, undefined, JSON.stringify(result));
    assert.deepEqual(result.structuredContent, {result: file});
    assert.equal(harness.requests.at(-1)?.path, path);
    assert.deepEqual(harness.requests.at(-1)?.query, {
      redirect: 'false',
      download: 'true',
    });

    const patch = await harness.call('update_attachment', {...route, body});
    assert.equal(patch.isError, undefined);
    assert.equal(harness.requests.at(-1)?.method, 'PATCH');
    assert.deepEqual(harness.requests.at(-1)?.body, body);

    const deletion = await harness.call('delete_attachment', route);
    assert.equal(deletion.isError, undefined);
    assert.equal(harness.requests.at(-1)?.method, 'DELETE');
    assert.equal(harness.requests.at(-1)?.path, path);
  }
  harness.reply({id: 20});
  const legacy = await harness.call('update_attachment', {
    target: 'legacy_card',
    card_id: 10,
    file_id: 20,
    body: {card_cover: false},
  });
  assert.equal(legacy.isError, undefined);
  assert.equal(harness.requests.at(-1)?.path, '/api/v1/cards/10/files/20');
  assert.deepEqual(harness.requests.at(-1)?.body, {card_cover: false});

  const before = harness.requests.length;
  for (const args of [
    {target: 'card', card_id: 10, file_id: 20, body},
    {target: 'card', card_uid: cardUid, file_uid: fileUid, body: {}},
    {
      target: 'legacy_card',
      card_id: 10,
      file_id: 20,
      body: {name: 'unsupported'},
    },
  ]) {
    assert.equal((await harness.call('update_attachment', args)).isError, true);
  }
  assert.equal(harness.requests.length, before);
});

test('attachment byte limits do not cap metadata or cause a storage fetch', async context => {
  const harness = await startHarness(context, 30_000, {
    ...canonical,
    KAITEN_MAX_FILE_BYTES: '2',
  });
  const route = {target: 'card', card_uid: cardUid, file_uid: fileUid};
  const metadata = {id: fileUid, size: '30000000'};
  harness.reply(metadata);
  assert.deepEqual(
    (await harness.call('get_attachment', route)).structuredContent,
    {result: metadata},
  );
  harness.respond((_request, response) => {
    response.writeHead(302, {location: `${harness.origin}/fixture-bytes`});
    response.end();
  });
  assert.deepEqual(
    (await harness.call('get_attachment', {...route, query: {redirect: true}}))
      .structuredContent,
    {result: {location: `${harness.origin}/fixture-bytes`}},
  );
  assert.equal(harness.requests.length, 2);
  const overflow = await harness.call('attach_file', {
    target: 'card',
    card_uid: cardUid,
    file: {data_base64: 'AAEC'},
  });
  assert.equal(overflow.isError, true);
  assert.match(JSON.stringify(overflow.content), /FILE_TOO_LARGE/);
  assert.equal(harness.requests.length, 2);

  let bytes = 'ok';
  harness.respond((request, response) => {
    if (request.path === '/fixture-bytes') {
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.end(bytes);
      return;
    }
    response.writeHead(302, {location: `${harness.origin}/fixture-bytes`});
    response.end();
  });
  const downloaded = await harness.call('download_attachment', route);
  assert.equal(downloaded.isError, undefined);
  assert.deepEqual(downloaded.content.at(-1), {
    type: 'resource',
    resource: {
      uri: `kaiten-file://cards/${cardUid}/${fileUid}`,
      mimeType: 'text/plain',
      blob: 'b2s=',
    },
  });
  assert.equal(harness.requests.at(-1)?.path, '/fixture-bytes');
  assert.equal(harness.requests.at(-1)?.authorization, undefined);

  bytes = 'overflow';
  const capped = await harness.call('download_attachment', route);
  assert.equal(capped.isError, true);
  assert.match(JSON.stringify(capped.content), /FILE_TOO_LARGE/);
});
