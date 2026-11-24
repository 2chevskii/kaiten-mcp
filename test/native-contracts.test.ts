import assert from 'node:assert/strict';
import {test} from 'node:test';
import {richDocument} from './document-cases.ts';
import {startHarness, token} from './harness.ts';

const canonical = {KAITEN_TOOL_PROFILE: 'canonical'};
const legacy = {KAITEN_TOOL_PROFILE: 'legacy'};

test('canonical workflow posts iteration additions in single and bulk forms', async context => {
  const harness = await startHarness(context, 30_000, canonical);
  const scope = {space_uid: 'space-uid', iteration_id: 'iteration-uid'};
  const cardUid = (number: number) =>
    `8e0456aa-856f-4b67-8c21-${number.toString(16).padStart(12, '0')}`;
  const card_uids = [cardUid(1), cardUid(2), cardUid(3)];
  const membership = {
    iteration_id: scope.iteration_id,
    card_uid: cardUid(1),
    removed_at: null,
  };
  const result = {
    added: [membership],
    removed: [
      {
        ...membership,
        iteration_id: 'previous-iteration',
        removed_at: '2026-11-24T11:00:00Z',
      },
    ],
    skipped: [{...membership, card_uid: cardUid(2)}],
    ineligible: [cardUid(3)],
    extra: true,
  };
  const single = {...membership, card_uid: 'single-card-uid'};

  harness.reply(result);
  const args = {...scope, card_uids};
  const bulk = await harness.call('add_iteration_member', args);
  assert.deepEqual(bulk.structuredContent, {result});

  harness.reply(single);
  const one = await harness.call('add_iteration_member', {
    ...scope,
    card_uid: single.card_uid,
  });
  assert.deepEqual(one.structuredContent, {result: single});
  assert.deepEqual(
    harness.requests,
    [{card_uids}, {card_uid: single.card_uid}].map(body => ({
      method: 'POST',
      path: '/api/v1/spaces/space-uid/iterations/iteration-uid/cards',
      query: {},
      body,
      authorization: `Bearer ${token}`,
    })),
  );

  const maximum = Array.from({length: 500}, (_, index) => cardUid(index + 1));
  for (const selection of [
    {},
    {card_uids: []},
    {card_uids: [cardUid(1), cardUid(1)]},
    {card_uids: ['single-card-uid']},
    {card_uids: [...maximum, cardUid(501)]},
    {card_uid: single.card_uid, card_uids},
  ]) {
    const invalid = await harness.call('add_iteration_member', {
      ...scope,
      ...selection,
    });
    assert.equal(invalid.isError, true);
  }
  assert.equal(harness.requests.length, 2);

  const empty = {added: [], removed: [], skipped: [], ineligible: []};
  harness.reply(empty);
  for (const selected of [[cardUid(1)], maximum]) {
    const accepted = await harness.call('add_iteration_member', {
      ...scope,
      card_uids: selected,
    });
    assert.deepEqual(accepted.structuredContent, {result: empty});
    assert.deepEqual(harness.requests.at(-1)?.body, {card_uids: selected});
  }
  assert.equal(harness.requests.length, 4);

  harness.reply({code: 7, card_uids}, 400);
  const refused = await harness.call('add_iteration_member', args);
  assert.equal(refused.isError, true);
  assert.equal(harness.requests.length, 5);
});

test('canonical workflow uses the native bulk DELETE and preserves single removal', async context => {
  const harness = await startHarness(context, 30_000, canonical);
  const scope = {space_uid: 'space-uid', iteration_id: 'iteration-uid'};
  const root = '/api/v1/spaces/space-uid/iterations/iteration-uid/cards';
  const result = {
    removed: [
      {card_uid: 'card-one', removed_at: '2026-11-24T11:00:00Z'},
      {card_uid: 'card-two', sort_order: 0},
    ],
    extra: true,
  };
  harness.reply(result);
  const args = {...scope, card_uids: ['card-one', 'card-two']};
  const bulk = await harness.call('remove_iteration_member', args);
  assert.deepEqual(bulk.structuredContent, {result});
  assert.deepEqual(harness.requests, [
    {
      method: 'DELETE',
      path: root,
      query: {},
      body: {card_uids: args.card_uids},
      authorization: `Bearer ${token}`,
    },
  ]);
  harness.reply(result.removed[0]);
  const one = await harness.call('remove_iteration_member', {
    ...scope,
    uid: 'card-one',
  });
  assert.deepEqual(one.structuredContent, {result: result.removed[0]});
  assert.equal(harness.requests[1]?.path, `${root}/card-one`);
  assert.equal(harness.requests[1]?.body, undefined);

  for (const body of [
    {card_uids: []},
    {card_uids: ['card-one', 'card-one']},
    {card_uids: [true]},
    {card_uids: ['']},
    {card_uids: Array.from({length: 501}, (_, index) => `card-${index}`)},
    {uid: 'card-one', card_uids: ['card-two']},
  ]) {
    const invalid = await harness.call('remove_iteration_member', {
      ...scope,
      ...body,
    });
    assert.equal(invalid.isError, true);
  }
  assert.equal(harness.requests.length, 2);

  const maximum = Array.from({length: 500}, (_, index) => `card-${index}`);
  harness.reply({removed: []});
  const last = await harness.call('remove_iteration_member', {
    ...scope,
    card_uids: maximum,
  });
  assert.deepEqual(last.structuredContent, {result: {removed: []}});
  assert.deepEqual(harness.requests[2]?.body, {card_uids: maximum});

  harness.reply({code: 7, card_uids: args.card_uids}, 400);
  const forbidden = await harness.call('remove_iteration_member', args);
  assert.equal(forbidden.isError, true);
  assert.equal(harness.requests.length, 4);
});

test('canonical document updates forward explicit schema and reject invalid combinations', async context => {
  const harness = await startHarness(context, 30_000, canonical);
  const document_uid = 'doc-uid';
  const body = {
    schema_version: 'v28',
    data: richDocument,
    public: false,
    settings: {content_width: 'wide'},
  };
  const result = {uid: document_uid, title: 'Spec', ...body};
  harness.reply(result);
  const update = await harness.call('update_document', {document_uid, body});
  assert.deepEqual(update.structuredContent, {result});
  assert.deepEqual(harness.requests, [
    {
      method: 'PATCH',
      path: '/api/v1/documents/doc-uid',
      query: {},
      body,
      authorization: `Bearer ${token}`,
    },
  ]);

  for (const invalid of [
    {schema_version: 'v28'},
    {schema_version: 'latest', data: richDocument},
    {schema_version: 'v0', data: richDocument},
    {schema_version: 28, data: richDocument},
    {...body, backup_version: 0},
    {...body, data: {type: 'paragraph', content: []}},
  ]) {
    const rejected = await harness.call('update_document', {
      document_uid,
      body: invalid,
    });
    assert.equal(rejected.isError, true);
  }
  assert.equal(harness.requests.length, 1);

  const restoreBody = {backup_version: 3};
  harness.reply({uid: document_uid, title: 'Restored'});
  const restore = await harness.call('update_document', {
    document_uid,
    body: restoreBody,
  });
  assert.notEqual(restore.isError, true);
  assert.deepEqual(harness.requests[1]?.body, restoreBody);
});

test('new native forms are absent from the v2 profile', async context => {
  const harness = await startHarness(context, 30_000, legacy);
  assert.ok(!harness.operations.has('iterations.addCardsToIteration'));
  assert.ok(!harness.operations.has('iterations.removeCardsFromIteration'));
  assert.ok(!harness.operations.has('documents.updateDocumentWithSchema'));
  const result = await harness.call('documents.updateDocument', {
    document_uid: 'doc-uid',
    body: {schema_version: 'v28', data: richDocument},
  });
  assert.equal(result.isError, true);
  assert.equal(harness.requests.length, 0);
});
