import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';

test('custom property definitions validate both creation contracts', async context => {
  const harness = await startHarness(context);
  for (const body of [
    {},
    {name: 'Missing type'},
    {type: 'invalid', name: 'Invalid'},
    {formula: '1 + 1'},
    {name: 'Test', type: 'string', data: {restrictions: {maxLength: '10'}}},
  ]) {
    assert.equal(
      (await harness.call('customProperties.createNewProperty', {body}))
        .isError,
      true,
    );
  }
  assert.equal(harness.requests.length, 0);
  harness.reply({id: 7, type: 'formula'});
  const body = {
    formula: '1 + 1',
    formula_source_card: {id: 10, properties: {id_7: 0}},
  };
  assert.deepEqual(
    (await harness.call('customProperties.createNewProperty', {body}))
      .structuredContent,
    {result: {id: 7, type: 'formula'}},
  );
  assert.deepEqual(harness.requests.at(-1)?.body, body);
});

test('custom values reject empty changes and invalid vote values before HTTP', async context => {
  const harness = await startHarness(context);
  for (const [operation, args] of [
    [
      'customPropertyCatalogValues.updateCatalogValue',
      {property_id: 7, value_id: 14, body: {deleted: true}},
    ],
    [
      'customPropertySelectValues.updateSelectValue',
      {property_id: 7, value_id: 14, body: {}},
    ],
    [
      'customPropertyCollectiveVoteValues.createNewVoteValue',
      {card_id: 10, property_id: 7, body: {}},
    ],
    [
      'customPropertyCollectiveScoreValues.createNewScoreValue',
      {card_id: 10, property_id: 7, value: 1},
    ],
    [
      'customPropertySelectValues.getListOfSelectValues',
      {property_id: 7, query: {conditions: ['invalid']}},
    ],
    ['customProperties.getListOfProperties', {query: {ids: [{}]}}],
  ] as const) {
    assert.equal(
      (await harness.call(operation, args)).isError,
      true,
      operation,
    );
  }
  assert.equal(harness.requests.length, 0);
});
