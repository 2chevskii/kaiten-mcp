import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';
import {directoryId} from './tool-cases.ts';
import {fieldId} from './directory-cases.ts';

test('directory operations validate UUIDs, nested fields and supported filter combinations', async context => {
  const harness = await startHarness(context);
  assert.equal(
    (
      await harness.call('customDirectories.updateCustomDirectory', {
        directory_id: directoryId,
        body: {expected_field_ids: [fieldId]},
      })
    ).isError,
    true,
  );
  assert.equal(
    (
      await harness.call('customDirectories.getCustomDirectory', {
        directory_id: '../other',
      })
    ).isError,
    true,
  );
  assert.equal(
    (
      await harness.call('customDirectories.createCustomDirectory', {
        body: {name: 'Invalid', fields: [{name: 'Bad', type: 'invalid'}]},
      })
    ).isError,
    true,
  );
  for (const filter of [
    {fieldId, fieldType: 'file', comparison: 'eq', value: 'ignored'},
    {fieldId, fieldType: 'number', comparison: 'contains', value: 'ignored'},
    {fieldId, fieldType: 'select', comparison: 'contains', value: 'ignored'},
    {fieldId, fieldType: 'string', comparison: 'eq'},
  ]) {
    assert.equal(
      (
        await harness.call('customDirectoryRecords.getListOfRecords', {
          directory_id: directoryId,
          query: {filters: [filter]},
        })
      ).isError,
      true,
    );
  }
  assert.equal(harness.requests.length, 0);
});

test('indexed directory filters use bracket parameters and preserve boolean/zero values', async context => {
  const harness = await startHarness(context);
  harness.reply([]);
  const result = await harness.call('customDirectoryRecords.getListOfRecords', {
    directory_id: directoryId,
    query: {
      filters: {
        0: {
          fieldId,
          fieldType: 'select',
          comparison: 'contains',
          value: 'Alice',
          searchByDisplayValue: true,
        },
        1: {fieldId, fieldType: 'number', comparison: 'eq', value: 0},
        2: {fieldId, fieldType: 'checkbox', comparison: 'false'},
      },
    },
  });
  assert.notEqual(result.isError, true);
  assert.deepEqual(harness.requests.at(-1)?.query, {
    'filters[0][fieldId]': fieldId,
    'filters[0][fieldType]': 'select',
    'filters[0][comparison]': 'contains',
    'filters[0][value]': 'Alice',
    'filters[0][searchByDisplayValue]': 'true',
    'filters[1][fieldId]': fieldId,
    'filters[1][fieldType]': 'number',
    'filters[1][comparison]': 'eq',
    'filters[1][value]': '0',
    'filters[2][fieldId]': fieldId,
    'filters[2][fieldType]': 'checkbox',
    'filters[2][comparison]': 'false',
  });
});
