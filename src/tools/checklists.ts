import * as z from 'zod/v4';
import {
  dateTime,
  defined,
  hasChanges,
  id,
  pageFields,
  text,
} from '../schemas.ts';
import {entityResult, offsetPage, pageResult} from '../results.ts';
import {change, create, read, type ToolRegistry} from '../tool-registry.ts';
import {
  checklistDetails,
  checklistItemView,
  checklistView,
  identityView,
} from '../views.ts';

const checklistIds = {card_id: id, checklist_id: id};
const itemFields = {
  text: text.optional(),
  checked: z.boolean().optional(),
  sort_order: z.number().finite().optional(),
  due_date: dateTime.nullable().optional(),
  responsible_id: id.nullable().optional(),
};

export function registerChecklists(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'list_checklists',
    'List checklist references on a card. Fetch item details with kaiten_get_checklist.',
    z.strictObject({card_id: id, ...pageFields}),
    pageResult(checklistView),
    read,
    async (args, options) => {
      const card = await client.cards.retrieveCard(
        args.card_id,
        undefined,
        options,
      );
      return offsetPage(card.checklists, args, true);
    },
  );
  registry.add(
    'get_checklist',
    'Read a card checklist and all its items.',
    z.strictObject(checklistIds),
    entityResult(checklistDetails),
    read,
    async (args, options) => ({
      item: await client.cardChecklists.retrieveCardChecklist(
        args.card_id,
        args.checklist_id,
        options,
      ),
    }),
  );
  registry.add(
    'create_checklist',
    'Create an empty named checklist on a card.',
    z.strictObject({
      card_id: id,
      name: text,
      sort_order: z.number().finite().optional(),
    }),
    entityResult(checklistView),
    create,
    async ({card_id, ...body}, options) => ({
      item: await client.cardChecklists.addChecklistToCard(
        card_id,
        defined(body),
        options,
      ),
    }),
  );
  registry.add(
    'update_checklist',
    'Change a checklist name or order.',
    z.strictObject({
      ...checklistIds,
      changes: z
        .strictObject({
          name: text.optional(),
          sort_order: z.number().finite().optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    entityResult(checklistView),
    change,
    async (args, options) => {
      const body = defined(args.changes);
      // The library encodes the at-least-one constraint as a union.
      if (body.name !== undefined) {
        return {
          item: await client.cardChecklists.updateChecklist(
            args.card_id,
            args.checklist_id,
            {...body, name: body.name},
            options,
          ),
        };
      }
      return {
        item: await client.cardChecklists.updateChecklist(
          args.card_id,
          args.checklist_id,
          {sort_order: body.sort_order!},
          options,
        ),
      };
    },
  );
  registry.add(
    'delete_checklist',
    'Delete a checklist from a card.',
    z.strictObject(checklistIds),
    entityResult(identityView),
    change,
    async (args, options) => ({
      item: await client.cardChecklists.removeChecklistFromCard(
        args.card_id,
        args.checklist_id,
        options,
      ),
    }),
  );
  registry.add(
    'add_checklist_item',
    'Add a checklist item with optional completion, order, due date and responsible user.',
    z.strictObject({
      ...checklistIds,
      ...itemFields,
      text,
      responsible_id: id.optional(),
    }),
    entityResult(checklistItemView),
    create,
    async ({card_id, checklist_id, ...body}, options) => ({
      item: await client.cardChecklistItems.addItemToChecklist(
        card_id,
        checklist_id,
        defined(body),
        options,
      ),
    }),
  );
  registry.add(
    'update_checklist_item',
    'Change checklist item fields. checked marks completion; null clears due_date or responsible_id.',
    z.strictObject({
      ...checklistIds,
      item_id: id,
      changes: z
        .strictObject(itemFields)
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    entityResult(checklistItemView),
    change,
    async (args, options) => {
      const changes = defined(args.changes);
      const body = requireItemChange(changes);
      return {
        item: await client.cardChecklistItems.updateChecklistItem(
          args.card_id,
          args.checklist_id,
          args.item_id,
          body,
          options,
        ),
      };
    },
  );
  registry.add(
    'delete_checklist_item',
    'Delete an item from a card checklist.',
    z.strictObject({...checklistIds, item_id: id}),
    entityResult(identityView),
    change,
    async (args, options) => ({
      item: await client.cardChecklistItems.removeChecklistItem(
        args.card_id,
        args.checklist_id,
        args.item_id,
        options,
      ),
    }),
  );
}

function requireItemChange(changes: {
  text?: string;
  checked?: boolean;
  sort_order?: number;
  due_date?: string | null;
  responsible_id?: number | null;
}) {
  if (changes.text !== undefined) return {...changes, text: changes.text};
  if (changes.checked !== undefined)
    return {...changes, checked: changes.checked};
  if (changes.sort_order !== undefined)
    return {...changes, sort_order: changes.sort_order};
  if (changes.due_date !== undefined)
    return {...changes, due_date: changes.due_date};
  if (changes.responsible_id !== undefined)
    return {...changes, responsible_id: changes.responsible_id};
  throw new TypeError('Supply at least one change.');
}
