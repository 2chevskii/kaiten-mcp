import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {AutomationTrigger} from '@2chevskii/kaiten-client';
import {startHarness, startSourceHarness} from './harness.ts';

test('automation variants accept nonempty action lists of any length and partial updates', async context => {
  const harness = await startSourceHarness(context);
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
  const harness = await startSourceHarness(context);
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

interface AutomationSchema {
  properties?: Record<string, AutomationSchema>;
  anyOf?: AutomationSchema[];
  enum?: string[];
  description?: string;
}

function triggerTypeSchema(schema: AutomationSchema) {
  const variants = schema.properties?.body?.anyOf;
  const triggered = variants?.find(item => item.properties?.trigger);
  const type = triggered?.properties?.trigger?.properties?.type;
  assert.ok(type?.enum);
  return {types: type.enum, description: type.description};
}

test('canonical automation mutations advertise and forward iteration triggers', async context => {
  const harness = await startHarness(context);
  const dateData = {
    variant: 'time_left_before_date',
    timezone: 'UTC',
    offset: 2,
    offset_unit: 'day',
  };
  const iterationRules = [
    {type: 'on_action', trigger: {type: 'iteration_card_added'}},
    {type: 'on_action', trigger: {type: 'iteration_card_removed'}},
    {
      type: 'on_date',
      trigger: {type: 'iteration_start_date_on_date', data: dateData},
    },
    {
      type: 'on_date',
      trigger: {type: 'iteration_finish_date_on_date', data: dateData},
    },
  ] satisfies {type: 'on_action' | 'on_date'; trigger: AutomationTrigger}[];
  const newTypes = iterationRules.map(rule => rule.trigger.type);
  for (const operationName of ['create_automation', 'update_automation']) {
    const operation = harness.operations.get(operationName);
    assert.equal(operation?.tool, 'kaiten_workflows_write');
    const current = triggerTypeSchema(operation!.schema);
    assert.equal(current.types.length, 25);
    assert.deepEqual(current.types.slice(-newTypes.length), newTypes);
    for (const type of newTypes) assert.ok(current.description?.includes(type));
  }

  const response = {id: 'automation-uid'};
  harness.reply(response);
  for (const rule of [
    ...iterationRules,
    {
      type: 'on_action',
      trigger: {type: 'card_moved_in_path', hasToFireOnCardCreation: true},
    },
  ]) {
    const creation = {
      space_id: 1,
      body: {...rule, actions: [{type: 'change_asap', data: {asap: true}}]},
    };
    const update = {
      space_id: 1,
      automation_uid: 'automation/uid',
      body: {trigger: rule.trigger},
    };
    for (const [operation, args, method, path] of [
      ['create_automation', creation, 'POST', '/api/v1/spaces/1/automations'],
      [
        'update_automation',
        update,
        'PATCH',
        '/api/v1/spaces/1/automations/automation%2Fuid',
      ],
    ] as const) {
      const result = await harness.call(operation, args);
      assert.deepEqual(result.structuredContent, {result: response});
      const request = harness.requests.at(-1);
      assert.equal(request?.method, method);
      assert.equal(request?.path, path);
      assert.deepEqual(request?.body, args.body);
    }
  }
  assert.equal(harness.requests.length, 10);
});
