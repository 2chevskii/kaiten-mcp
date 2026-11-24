import type {OperationOptions} from '@2chevskii/kaiten-client';
import * as z from 'zod/v4';
import {
  automationBody,
  automationUpdateBody,
  canonicalAutomationBody,
  canonicalAutomationUpdateBody,
} from '../automation-schemas.ts';
import {apiResult} from '../results.ts';
import {id, text} from '../schemas.ts';
import {change, read, type ToolRegistry} from '../tool-registry.ts';

const createInput = z.strictObject({space_id: id, body: automationBody});
const updateInput = z.strictObject({
  space_id: id,
  automation_uid: text,
  body: automationUpdateBody,
});
const canonicalCreateInput = createInput.extend({
  body: canonicalAutomationBody,
});
const canonicalUpdateInput = updateInput.extend({
  body: canonicalAutomationUpdateBody,
});

export function registerAutomations(registry: ToolRegistry): void {
  const {automations} = registry.client;
  const createAutomation = async (
    args: z.output<typeof canonicalCreateInput>,
    options: OperationOptions,
  ) => ({
    result: await automations.createAutomation(
      args.space_id,
      args.body as Parameters<typeof automations.createAutomation>[1],
      options,
    ),
  });
  const updateAutomation = async (
    args: z.output<typeof canonicalUpdateInput>,
    options: OperationOptions,
  ) => ({
    result: await automations.updateAutomation(
      args.space_id,
      args.automation_uid,
      args.body as Parameters<typeof automations.updateAutomation>[2],
      options,
    ),
  });
  registry.add(
    'automations.getListOfAutomations',
    'List space automations with full triggers, recursive conditions, actions, and status.',
    z.strictObject({space_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await automations.getListOfAutomations(args.space_id, options),
    }),
  );
  registry.add(
    'automations.createAutomation',
    'Create an event, date, or on-demand automation; requires a nonempty action list.',
    createInput,
    apiResult,
    change,
    createAutomation,
  );
  registry.add(
    'automations.updateAutomation',
    'Partially update an automation using native trigger, condition, and action fields.',
    updateInput,
    apiResult,
    change,
    updateAutomation,
  );
  registry.add(
    'catalog.createAutomation',
    'Create an automation, including iteration events and date rules.',
    canonicalCreateInput,
    apiResult,
    change,
    createAutomation,
    {canonicalOnly: true},
  );
  registry.add(
    'catalog.updateAutomation',
    'Update an automation, including iteration events and date rules.',
    canonicalUpdateInput,
    apiResult,
    change,
    updateAutomation,
    {canonicalOnly: true},
  );
  registry.add(
    'automations.deleteAutomation',
    'Delete a space automation by UID.',
    z.strictObject({space_id: id, automation_uid: text}),
    apiResult,
    change,
    async (args, options) => ({
      result: await automations.deleteAutomation(
        args.space_id,
        args.automation_uid,
        options,
      ),
    }),
  );
}
