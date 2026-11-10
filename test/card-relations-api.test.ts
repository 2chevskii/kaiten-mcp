import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';

test('blockers and planned relations validate required combinations', async context => {
  const harness = await startHarness(context);
  for (const body of [{}, {due_date: '2026-11-06'}]) {
    assert.equal(
      (
        await harness.call('cardBlockers.updateCardBlockers', {
          card_id: 10,
          blocker_id: 6,
          body,
        })
      ).isError,
      true,
    );
  }
  for (const body of [
    {},
    {type: 'invalid'},
    {gap: null},
    {gap_type: null},
    {gap: 1, gap_type: null},
  ]) {
    assert.equal(
      (
        await harness.call('cardPlannedRelations.updatePlannedRelation', {
          card_id: 10,
          target_card_id: 20,
          body,
        })
      ).isError,
      true,
    );
  }
  assert.equal(harness.requests.length, 0);
  harness.reply({source_id: 10, target_id: 20});
  for (const body of [
    {type: 'start-start'},
    {gap: -2, gap_type: 'hours'},
    {gap: 0},
    {gap_type: 'days'},
    {gap: null, gap_type: null},
  ]) {
    assert.notEqual(
      (
        await harness.call('cardPlannedRelations.updatePlannedRelation', {
          card_id: 10,
          target_card_id: 20,
          body,
        })
      ).isError,
      true,
    );
    assert.deepEqual(harness.requests.at(-1)?.body, body);
  }
});

test('relationship operations stay in their domain tools', async context => {
  const harness = await startHarness(context);
  assert.equal(
    harness.operations.get('cardBlockers.blockCard')?.tool,
    'kaiten_relations_write',
  );
  assert.equal(
    harness.operations.get('cardPlannedRelations.addPlannedRelation')?.tool,
    'kaiten_relations_write',
  );
  assert.equal(
    harness.operations.get('cardChildren.retrieveCardChildrenList')?.tool,
    'kaiten_children_read',
  );
  assert.equal(
    harness.operations.get('cardExternalLinks.retrieveCardExternalLinks')?.tool,
    'kaiten_external_links_read',
  );
});
