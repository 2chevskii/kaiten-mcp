import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness} from './harness.ts';

test('automation variants accept nonempty action lists of any length and partial updates', async context => {
  const harness = await startHarness(context);
  harness.reply({id: 'automation-uid'});
  for (const type of ['on_action', 'on_date', 'on_demand']) {
    for (const count of [1, 2, 3]) {
      const body = {
        type,
        name: 'Fixture',
        ...(type === 'on_demand' ? {} : {trigger: {type: 'due_date_on_date'}}),
        actions: Array.from({length: count}, () => ({
          type: 'fixture',
          data: {},
        })),
      };
      const result = await harness.call('automations.createAutomation', {
        space_id: 1,
        body,
      });
      assert.equal(result.isError, undefined);
      assert.deepEqual(harness.requests.at(-1)?.body, body);
    }
  }
  for (const body of [
    {},
    {name: ''},
    {trigger: {type: 'all_conditions_met'}},
  ]) {
    assert.equal(
      (
        await harness.call('automations.updateAutomation', {
          space_id: 1,
          automation_uid: 'uid',
          body,
        })
      ).isError,
      undefined,
    );
    assert.deepEqual(harness.requests.at(-1)?.body, body);
  }
});

test('automation schema rejects malformed variants, triggers, actions, and nested conditions before HTTP', async context => {
  const harness = await startHarness(context);
  const valid = {
    type: 'on_action',
    trigger: {type: 'card_created'},
    actions: [{type: 'fixture', data: {}}],
  };
  for (const body of [
    {...valid, actions: []},
    {...valid, actions: [{type: 'fixture'}]},
    {...valid, actions: [{type: 'fixture', data: []}]},
    {...valid, trigger: {type: 'unknown'}},
    {
      ...valid,
      trigger: {type: 'card_created', hasToFireOnCardCreation: 'false'},
    },
    {...valid, conditions: {clause: 'xor', conditions: []}},
    {
      ...valid,
      conditions: {
        clause: 'and',
        conditions: [{clause: 'or', conditions: [{data: {}}]}],
      },
    },
    {type: 'on_demand', actions: valid.actions},
    {type: 'on_date', actions: valid.actions},
    {...valid, type: 'on_demand', name: 'No trigger allowed'},
  ]) {
    assert.equal(
      (await harness.call('automations.createAutomation', {space_id: 1, body}))
        .isError,
      true,
    );
  }
  assert.equal(harness.requests.length, 0);
});
