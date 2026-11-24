import * as z from 'zod/v4';
import {cardInput, id} from '../schemas.ts';
import {entityResult} from '../results.ts';
import {change, type ToolRegistry} from '../tool-registry.ts';
import {cardDetails} from '../views.ts';

export function registerCardWrite(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'move_card',
    z.strictObject({card_id: id, board_id: id, column_id: id, lane_id: id}),
    entityResult(cardDetails),
    change,
    async ({card_id, ...location}, options) => ({
      item: await client.cards.updateCard(card_id, location, options),
    }),
  );
  registry.add(
    'archive_card',
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
}
