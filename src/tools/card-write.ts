import * as z from 'zod/v4';
import {
  cardInput,
  dateTime,
  defined,
  hasChanges,
  id,
  properties,
  text,
} from '../schemas.ts';
import {entityResult} from '../results.ts';
import {change, create, type ToolRegistry} from '../tool-registry.ts';
import {cardDetails, identityView} from '../views.ts';

const editableFields = {
  title: text.optional(),
  description: z.string().nullable().optional(),
  due_date: dateTime.nullable().optional(),
  due_date_time_present: z.boolean().optional(),
  asap: z.boolean().optional(),
  size_text: z.string().nullable().optional(),
  owner_id: id.optional(),
  type_id: id.optional(),
};

export function registerCardWrite(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'create_card',
    'Create a card on a board. Description uses Markdown. Optional properties use Kaiten id_<propertyId> keys.',
    z.strictObject({
      ...editableFields,
      title: text,
      board_id: id,
      column_id: id.optional(),
      lane_id: id.optional(),
      properties: properties.optional(),
    }),
    entityResult(cardDetails),
    create,
    async (args, options) => ({
      item: await client.cards.createNewCard(defined(args), options),
    }),
  );
  registry.add(
    'update_card',
    'Update the supplied card fields. Omitted fields remain unchanged; null clears supported fields. Description uses Markdown.',
    z.strictObject({
      card_id: id,
      changes: z
        .strictObject(editableFields)
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    entityResult(cardDetails),
    change,
    async (args, options) => ({
      item: await client.cards.updateCard(
        args.card_id,
        defined(args.changes),
        options,
      ),
    }),
  );
  registry.add(
    'move_card',
    'Move a card to an explicit board, column and lane. Obtain valid target IDs using the navigation tools.',
    z.strictObject({card_id: id, board_id: id, column_id: id, lane_id: id}),
    entityResult(cardDetails),
    change,
    async ({card_id, ...location}, options) => ({
      item: await client.cards.updateCard(card_id, location, options),
    }),
  );
  registry.add(
    'archive_card',
    'Archive a card. The card can be restored with kaiten_restore_card.',
    cardInput,
    entityResult(cardDetails),
    change,
    async (args, options) => ({
      item: await client.cards.updateCard(
        args.card_id,
        {condition: 2},
        options,
      ),
    }),
  );
  registry.add(
    'restore_card',
    'Restore an archived card to its live condition.',
    cardInput,
    entityResult(cardDetails),
    change,
    async (args, options) => ({
      item: await client.cards.updateCard(
        args.card_id,
        {condition: 1},
        options,
      ),
    }),
  );
  registry.add(
    'delete_card',
    'Delete a card using the Kaiten delete endpoint. This is a destructive operation; use archive_card for archiving.',
    cardInput,
    entityResult(identityView),
    change,
    async (args, options) => ({
      item: await client.cards.deleteCard(args.card_id, options),
    }),
  );
}
