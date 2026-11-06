import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';

for (const resource of ['documents', 'documentGroups']) {
  test(`${resource} iterator preserves filters and opaque v2 cursors`, async context => {
    const harness = await startHarness(context);
    harness.respond((request, response) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(
        JSON.stringify(
          request.query.start_position === 'next'
            ? {result: [{uid: 'second'}], position: ''}
            : {result: [{uid: 'first'}], position: 'next'},
        ),
      );
    });
    const result = await harness.call(`${resource}.iterate`, {
      query: {query: 'Spec', condition: 1, limit: 1},
    });
    assert.deepEqual(result.structuredContent, {
      result: {items: [{uid: 'first'}, {uid: 'second'}], truncated: false},
    });
    assert.deepEqual(
      harness.requests.map(request => request.query),
      [
        {query: 'Spec', condition: '1', limit: '1', version: '2'},
        {
          query: 'Spec',
          condition: '1',
          limit: '1',
          version: '2',
          start_position: 'next',
        },
      ],
    );
    assert.ok(
      harness.requests.every(
        request =>
          request.path ===
          `/api/v1/${resource === 'documents' ? 'documents' : 'document-groups'}`,
      ),
    );
  });
}

test('document tree validation rejects invalid root, nodes, marks and typed settings before HTTP', async context => {
  const harness = await startHarness(context);
  for (const body of [
    {},
    {data: {type: 'paragraph', content: []}},
    {data: {type: 'doc'}},
    {data: {type: 'doc', content: [{text: 'Missing node type'}]}},
    {data: {type: 'doc', content: [{type: 'text'}]}},
    {data: {type: 'doc', content: [{type: 'text', text: ''}]}},
    {
      data: {
        type: 'doc',
        content: [{type: 'text', text: 'Invalid marks', marks: [{attrs: {}}]}],
      },
    },
    {settings: {content_width: 'invalid'}},
  ]) {
    assert.equal(
      (
        await harness.call('documents.updateDocument', {
          document_uid: 'document-uid',
          body,
        })
      ).isError,
      true,
    );
  }
  assert.equal(
    (
      await harness.call('documents.createNewDocument', {
        body: {title: 'Missing order'},
      })
    ).isError,
    true,
  );
  assert.equal(
    (
      await harness.call('documentSchemas.getDocumentDataSchema', {
        schema_version: '1',
        format: 'invalid',
      })
    ).isError,
    true,
  );
  assert.equal(harness.requests.length, 0);
});

test('document reads preserve default/v1 arrays and draft-06 schemas', async context => {
  const harness = await startHarness(context);
  harness.reply([{uid: 'document-uid', group_id: null}]);
  assert.deepEqual(
    (
      await harness.call('documents.retrieveListOfDocuments', {
        query: {offset: 0, limit: 2},
      })
    ).structuredContent,
    {result: [{uid: 'document-uid', group_id: null}]},
  );
  assert.deepEqual(harness.requests.at(-1)?.query, {offset: '0', limit: '2'});
  const schema = {
    version: '1',
    $schema: 'http://json-schema.org/draft-06/schema#',
    type: 'object',
    definitions: {node: {type: 'object'}},
    customKeyword: {preserved: true},
  };
  harness.reply(schema);
  assert.deepEqual(
    (
      await harness.call('documentSchemas.getDocumentDataSchema', {
        schema_version: '1',
        format: 'draft-06',
      })
    ).structuredContent,
    {result: schema},
  );
  assert.deepEqual(harness.requests.at(-1)?.query, {format: 'draft-06'});
});
