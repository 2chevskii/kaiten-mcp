import type {
  AutomationConditionGroup,
  AutomationTriggerType,
} from '@2chevskii/kaiten-client';
import * as z from 'zod/v4';
import {defined, text} from './schemas.ts';

const legacyTriggerTypes = {
  card_moved_in_path: true,
  card_created: true,
  comment_posted: true,
  card_user_added: true,
  responsible_added: true,
  card_type_changed: true,
  card_state_changed: true,
  custom_property_changed: true,
  due_date_changed: true,
  checklist_item_checked: true,
  checklists_completed: true,
  child_cards_state_changed: true,
  tag_added: true,
  tag_removed: true,
  blocked: true,
  unblocked: true,
  blocker_added: true,
  due_date_on_date: true,
  checklist_item_due_date_on_date: true,
  custom_property_date_on_date: true,
  all_conditions_met: true,
} satisfies Partial<Record<AutomationTriggerType, true>>;

const canonicalTriggerTypes = {
  ...legacyTriggerTypes,
  iteration_card_added: true,
  iteration_card_removed: true,
  iteration_start_date_on_date: true,
  iteration_finish_date_on_date: true,
} satisfies Record<AutomationTriggerType, true>;

const data = z.record(z.string(), z.json());
const trigger = z.strictObject({
  type: z.enum(
    Object.keys(legacyTriggerTypes) as (keyof typeof legacyTriggerTypes)[],
  ),
  hasToFireOnCardCreation: z.boolean().optional(),
  data: data.optional(),
});
const action = z.strictObject({
  type: text,
  data,
  created: z.string().optional(),
});
const condition = z.strictObject({
  type: text,
  operator: z.string().optional(),
  data: data.optional(),
  created: z.string().optional(),
});
const conditionGroup: z.ZodType<AutomationConditionGroup> = z.lazy(() =>
  z
    .strictObject({
      clause: z.enum(['and', 'or']),
      conditions: z.array(
        z.union([condition.transform(defined), conditionGroup]),
      ),
      created: z.string().optional(),
    })
    .transform(defined),
);
const actions = z.array(action).min(1);
const triggered = z.strictObject({
  type: z.enum(['on_action', 'on_date']),
  name: z.string().optional(),
  trigger,
  conditions: conditionGroup.optional(),
  actions,
});
const onDemand = z.strictObject({
  type: z.literal('on_demand'),
  name: z.string(),
  actions,
});
const canonicalTriggered = triggered.extend({
  trigger: trigger.extend({
    type: z.enum(Object.keys(canonicalTriggerTypes) as AutomationTriggerType[]),
  }),
});

export const automationBody = z.union([triggered, onDemand]);
export const automationUpdateBody = z.union([
  triggered.partial(),
  onDemand.partial(),
]);
export const canonicalAutomationBody = z.union([canonicalTriggered, onDemand]);
export const canonicalAutomationUpdateBody = z.union([
  canonicalTriggered.partial(),
  onDemand.partial(),
]);
