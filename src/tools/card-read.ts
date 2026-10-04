import * as z from 'zod/v4';
import {cardInput, dateTime, defined, id, pageFields} from '../schemas.ts';
import {entityResult} from '../results.ts';
import {read, type ToolRegistry} from '../tool-registry.ts';
import {cardDetails, cardSummary} from '../views.ts';

const invalidCursor =
  'Invalid search cursor. Start a new search without cursor.';
const searchCursor = z
  .string()
  .regex(/^offset:(0|[1-9]\d*)$/, invalidCursor)
  .refine(value => {
    const offset = Number(value.slice(7));
    return (
      Number.isSafeInteger(offset) && offset <= Number.MAX_SAFE_INTEGER - 100
    );
  }, invalidCursor);

export function registerCardRead(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'search_cards',
    'Search cards with filters. Returns summaries and a cursor; reuse the same filters with next_cursor. Fetch details with kaiten_get_card.',
    z.strictObject({
      query: z.string().optional(),
      space_id: id.optional(),
      board_id: id.optional(),
      column_id: id.optional(),
      lane_id: id.optional(),
      owner_ids: z.array(id).optional(),
      member_ids: z.array(id).optional(),
      responsible_ids: z.array(id).optional(),
      tag_ids: z.array(id).optional(),
      type_ids: z.array(id).optional(),
      states: z
        .array(z.union([z.literal(1), z.literal(2), z.literal(3)]))
        .optional(),
      archived: z.boolean().optional(),
      asap: z.boolean().optional(),
      overdue: z.boolean().optional(),
      due_date_after: dateTime.optional(),
      due_date_before: dateTime.optional(),
      limit: pageFields.limit,
      cursor: searchCursor.optional(),
    }),
    z.object({items: z.array(cardSummary), next_cursor: z.string().nullable()}),
    read,
    async ({cursor, ...query}, options) => {
      const offset = cursor ? Number(cursor.slice(7)) : 0;
      const response = await client.cards.retrieveCardList(
        {
          ...defined(query),
          version: 1,
          offset,
          order_by: ['id'],
          order_direction: ['asc'],
        },
        options,
      );
      return {
        items: response,
        next_cursor:
          response.length === query.limit
            ? `offset:${offset + response.length}`
            : null,
      };
    },
  );
  registry.add(
    'get_card',
    'Get a card with its full description, members, tags, properties and checklist references. Read comments and checklist items with their dedicated tools.',
    cardInput,
    entityResult(cardDetails),
    read,
    async (args, options) => ({
      item: await client.cards.retrieveCard(args.card_id, undefined, options),
    }),
  );
}
