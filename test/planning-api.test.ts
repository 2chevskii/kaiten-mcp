import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';

test('iteration changes enforce the public status and change combinations', async context => {
  const harness = await startHarness(context);
  for (const body of [
    {},
    {status: 'deleted'},
    {actual_finish_date: '2026-11-06'},
    {new_iteration_id: 'replacement-id'},
  ]) {
    assert.equal(
      (
        await harness.call('iterations.updateIteration', {
          space_uid: 'space-uid',
          id: 'iteration-id',
          body,
        })
      ).isError,
      true,
    );
  }
  assert.equal(
    (
      await harness.call('iterations.addCardToIteration', {
        space_uid: 'space-uid',
        iteration_id: 'iteration-id',
        card_uid: '',
      })
    ).isError,
    true,
  );
  assert.equal(harness.requests.length, 0);
});

test('iteration deletion preserves omitted replacement versus explicit null', async context => {
  const harness = await startHarness(context);
  harness.reply({id: 'iteration-id'});
  assert.notEqual(
    (
      await harness.call('iterations.deleteIteration', {
        space_uid: 'space-uid',
        id: 'iteration-id',
      })
    ).isError,
    true,
  );
  assert.equal(harness.requests.at(-1)?.body, undefined);
  assert.notEqual(
    (
      await harness.call('iterations.deleteIteration', {
        space_uid: 'space-uid',
        id: 'iteration-id',
        new_iteration_id: 'replacement-id',
      })
    ).isError,
    true,
  );
  assert.deepEqual(harness.requests.at(-1)?.body, {
    new_iteration_id: 'replacement-id',
  });
});
