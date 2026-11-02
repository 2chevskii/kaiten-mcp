import * as z from 'zod/v4';
import {id, pageFields} from '../schemas.ts';
import {entityResult, offsetPage, pageResult} from '../results.ts';
import {change, create, read, type ToolRegistry} from '../tool-registry.ts';
import {cardSummary, identityView} from '../views.ts';

export function registerCardChildren(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'list_card_children',
    'List child cards of parent_card_id. Returned id identifies the child card. Pagination is applied locally.',
    z.strictObject({parent_card_id: id, ...pageFields}),
    pageResult(cardSummary),
    read,
    async (args, options) =>
      offsetPage(
        await client.cardChildren.retrieveCardChildrenList(
          args.parent_card_id,
          options,
        ),
        args,
        true,
      ),
  );
  registry.add(
    'add_card_child',
    'Link an existing child_card_id to parent_card_id. Returns the child card; does not create a card.',
    z.strictObject({parent_card_id: id, child_card_id: id}),
    entityResult(cardSummary),
    create,
    async (args, options) => ({
      item: await client.cardChildren.addChildren(
        args.parent_card_id,
        args.child_card_id,
        options,
      ),
    }),
  );
  registry.add(
    'remove_card_child',
    'Unlink child_card_id from parent_card_id without deleting either card. Use the child card id, not a relationship id. Returns the ID confirmed by Kaiten.',
    z.strictObject({parent_card_id: id, child_card_id: id}),
    entityResult(identityView),
    change,
    async (args, options) => ({
      item: await client.cardChildren.removeChildren(
        args.parent_card_id,
        args.child_card_id,
        options,
      ),
    }),
  );
}
