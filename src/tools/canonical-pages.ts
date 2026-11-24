import * as z from 'zod/v4';
import {offsetPage, pageResult} from '../results.ts';
import {dateOnly, defined, id, pageFields} from '../schemas.ts';
import {read, type ToolRegistry} from '../tool-registry.ts';
import {cardSummary, commentView} from '../views.ts';

const upstreamPage = {
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe(
      'Server page size, default 100. Keep it unchanged when continuing.',
    ),
  offset: pageFields.offset
    .removeDefault()
    .max(Number.MAX_SAFE_INTEGER - 100)
    .optional()
    .describe(
      'Zero-based server offset, default 0. Use the previous next_offset with the same scope and filters.',
    ),
};
const fullMetadata = z.enum(['compact', 'full']).optional();
const brokenApi = z
  .boolean()
  .optional()
  .describe(
    'User property format: true uses UID strings; false uses numeric user IDs.',
  );
const recordPage = pageResult(z.json());
const nativePage = z.object({
  result: z.array(z.json()),
  next_offset: recordPage.shape.next_offset,
});
const currentUserBlockersPage = z.object({
  result: z.looseObject({
    blocked_cards: z.array(z.json()),
  }),
  next_offset: recordPage.shape.next_offset,
});

function pageBounds(args: {
  limit?: number | undefined;
  offset?: number | undefined;
}) {
  return {limit: args.limit ?? 100, offset: args.offset ?? 0};
}

export function registerCanonicalPages(registry: ToolRegistry): void {
  const {client} = registry;
  registry.group('collaboration');
  registry.add(
    'catalog.listComments',
    'Read a server page of card comments.',
    z.strictObject({card_id: id, format: fullMetadata, ...upstreamPage}),
    recordPage,
    read,
    async ({card_id, format, ...query}, options) => {
      const result = await client.cardComments.retrieveCardComments(card_id, {
        ...options,
        query: defined(query),
      });
      return offsetPage(
        format === 'full' ? result : z.array(commentView).parse(result),
        pageBounds(query),
      );
    },
    {canonicalOnly: true},
  );
  registry.add(
    'catalog.listCardChildren',
    'Read a server page of child link records.',
    z.strictObject({
      parent_card_id: id,
      format: fullMetadata,
      broken_api: brokenApi,
      ...upstreamPage,
    }),
    recordPage,
    read,
    async ({parent_card_id, format, ...query}, options) => {
      const result = await client.cardChildren.retrieveCardChildrenList(
        parent_card_id,
        {...options, query: defined(query)},
      );
      return offsetPage(
        format === 'full' ? result : z.array(cardSummary).parse(result),
        pageBounds(query),
      );
    },
    {canonicalOnly: true},
  );
  registry.add(
    'catalog.listCardBlockers',
    'Read a server page of a selected card’s blockers.',
    z.strictObject({card_id: id, broken_api: brokenApi, ...upstreamPage}),
    nativePage,
    read,
    async ({card_id, ...query}, options) => {
      const result = await client.cardBlockers.retrieveCardBlockersList(
        card_id,
        {...options, query: defined(query)},
      );
      return {
        result,
        next_offset: offsetPage(result, pageBounds(query)).next_offset,
      };
    },
    {canonicalOnly: true},
  );
  registry.add(
    'catalog.listMyBlockedCards',
    'Read a server page of cards blocked by the token user.',
    z.strictObject(upstreamPage),
    currentUserBlockersPage,
    read,
    async (query, options) => {
      const result =
        await client.cardBlockerUsers.retrieveBlockersCardsListOnCurrentUser({
          ...options,
          query: defined(query),
        });
      return {
        result,
        next_offset: offsetPage(result.blocked_cards, pageBounds(query))
          .next_offset,
      };
    },
    {canonicalOnly: true},
  );
  registry.group('workflows');
  registry.add(
    'catalog.listCardTimeLogs',
    'Read a server page of time logs for one card.',
    z.strictObject({
      card_id: id,
      for_date: dateOnly.optional(),
      personal: z.boolean().optional(),
      ...upstreamPage,
    }),
    nativePage,
    read,
    async ({card_id, for_date, personal, ...query}, options) => {
      const result = await client.cardTimeLogs.getTimeLogs(
        card_id,
        for_date,
        personal,
        {...options, query: defined(query)},
      );
      return {
        result,
        next_offset: offsetPage(result, pageBounds(query)).next_offset,
      };
    },
    {canonicalOnly: true},
  );
}
