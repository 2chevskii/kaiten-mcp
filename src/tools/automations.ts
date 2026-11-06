import * as z from 'zod/v4';
import {automationBody, automationUpdateBody} from '../automation-schemas.ts';
import {apiResult} from '../results.ts';
import {id, text} from '../schemas.ts';
import {change, read, type ToolRegistry} from '../tool-registry.ts';

export function registerAutomations(registry: ToolRegistry): void {
  const {automations} = registry.client;
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
    z.strictObject({space_id: id, body: automationBody}),
    apiResult,
    change,
    async (args, options) => ({
      result: await automations.createAutomation(
        args.space_id,
        args.body as Parameters<typeof automations.createAutomation>[1],
        options,
      ),
    }),
  );
  registry.add(
    'automations.updateAutomation',
    'Partially update an automation using native trigger, condition, and action fields.',
    z.strictObject({
      space_id: id,
      automation_uid: text,
      body: automationUpdateBody,
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await automations.updateAutomation(
        args.space_id,
        args.automation_uid,
        args.body as Parameters<typeof automations.updateAutomation>[2],
        options,
      ),
    }),
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
