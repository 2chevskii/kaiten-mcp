import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';

test('workspace operations validate nested bodies before HTTP', async context => {
  const harness = await startHarness(context);
  for (const [operation, args] of [
    ['spaces.createNewSpace', {body: {}}],
    ['spaces.updateSpace', {space_id: 1, body: {}}],
    ['columns.updateColumn', {board_id: 2, column_id: 3, body: {type: 4}}],
    [
      'spaceBoards.createNewBoard',
      {
        space_id: 1,
        body: {title: 'Board', columns: [{title: 'Column', type: 4}]},
      },
    ],
    ['lanes.removeLane', {board_id: 2, lane_id: 0}],
    [
      'subcolumn.updateSubcolumn',
      {column_id: 3, subcolumn_id: 4, body: {typo: true}},
    ],
  ] as const) {
    const result = await harness.call(operation, args);
    assert.equal(result.isError, true, operation);
  }
  assert.equal(harness.requests.length, 0);
  const emptyUpdate = await harness.call('spaces.updateSpace', {
    space_id: 1,
    body: {},
  });
  assert.match(JSON.stringify(emptyUpdate), /Supply at least one change/);
});
