import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';

test('checklist cloning, sharing and moves retain all supplied fields', async context => {
  const harness = await startHarness(context);
  harness.reply({id: 8});
  const body = {
    name: 'Copy',
    items_source_checklist_id: 8,
    exclude_item_ids: [],
  };
  assert.notEqual(
    (
      await harness.call('cardChecklists.addChecklistToCard', {
        card_id: 10,
        body,
      })
    ).isError,
    true,
  );
  assert.deepEqual(harness.requests.at(-1)?.body, body);
  assert.equal(
    harness.operations.get(
      'spaceTemplateChecklist.getListOfSpaceTemplateChecklists',
    )?.tool,
    'kaiten_checklists_read',
  );
});

test('checklist and template changes validate required combinations', async context => {
  const harness = await startHarness(context);
  for (const [operation, args] of [
    [
      'cardChecklists.addChecklistToCard',
      {card_id: 10, body: {items_source_checklist_id: 8}},
    ],
    [
      'cardChecklistItems.updateChecklistItem',
      {card_id: 10, checklist_id: 8, item_id: 9, body: {}},
    ],
    [
      'checklistItems.updateChecklistItem',
      {checklist_id: 8, item_id: 9, body: {checked: 'false'}},
    ],
    [
      'spaceTemplateChecklist.updateSpaceTemplateChecklist',
      {
        space_uid: 'space-uid',
        template_checklist_uid: 'template-uid',
        body: {space_uid: 'other-space'},
      },
    ],
    [
      'spaceTemplateChecklistItems.updateSpaceTemplateChecklistItem',
      {
        space_uid: 'space-uid',
        template_checklist_uid: 'template-uid',
        item_uid: 'item-uid',
        body: {},
      },
    ],
  ] as const)
    assert.equal(
      (await harness.call(operation, args)).isError,
      true,
      operation,
    );
  assert.equal(harness.requests.length, 0);
});
