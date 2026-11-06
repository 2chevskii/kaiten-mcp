import * as z from 'zod/v4';
import {encodeCardFilter, type CardFilter} from '@2chevskii/kaiten-client';
import {id} from '../schemas.ts';
import {cardFilter} from '../card-filter-schema.ts';
import {
  cardBatchBody,
  cardCreateBody,
  cardUpdateBody,
  cardSearchQuery,
} from '../card-schemas.ts';
import {read, change, type ToolRegistry} from '../tool-registry.ts';
import {apiResult, collectItems} from '../results.ts';

export function registerAdvancedCardOperations(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'encodeCardFilter',
    'Encode a structured card filter as base64 without making an HTTP request.',
    z.strictObject({filter: cardFilter}),
    apiResult,
    read,
    async args => ({result: encodeCardFilter(args.filter as CardFilter)}),
  );
  registry.add(
    'cards.iterate',
    'Read across search pages using the client iterator. Returns a bounded snapshot with items and truncated; use retrieveCardList for resumable pages.',
    z.strictObject({
      query: cardSearchQuery.omit({version: true, offset: true}).optional(),
      max_items: z.number().int().min(1).max(1_000).default(100),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await collectItems(
        client.cards.iterate(
          args.query as Parameters<typeof client.cards.iterate>[0],
          options,
        ),
        args.max_items,
      ),
    }),
  );
  registry.add(
    'cards.batchUpdateForCards',
    'Batch update for cards (cards); full API fields and JSON response.',
    z.strictObject({body: cardBatchBody}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cards.batchUpdateForCards(
        args.body as Parameters<typeof client.cards.batchUpdateForCards>[0],
        options,
      ),
    }),
  );
  registry.add(
    'cards.createNewCard',
    'Create new card (cards); full API fields and JSON response.',
    z.strictObject({
      body: cardCreateBody,
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cards.createNewCard(
        args.body as Parameters<typeof client.cards.createNewCard>[0],
        options,
      ),
    }),
  );
  registry.add(
    'cards.deleteCard',
    'Delete card (cards); full API fields and JSON response.',
    z.strictObject({card_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cards.deleteCard(args.card_id, options),
    }),
  );
  registry.add(
    'cards.retrieveCard',
    'Retrieve card (cards); full API fields and JSON response.',
    z.strictObject({card_id: id, broken_api: z.boolean().optional()}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cards.retrieveCard(
        args.card_id,
        args.broken_api,
        options,
      ),
    }),
  );
  registry.add(
    'cards.retrieveCardBaselines',
    'Retrieve card baselines (cards); full API fields and JSON response.',
    z.strictObject({card_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cards.retrieveCardBaselines(args.card_id, options),
    }),
  );
  registry.add(
    'cards.retrieveCardList',
    'Retrieve card list (cards); full API fields and JSON response.',
    z.strictObject({
      query: cardSearchQuery.optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cards.retrieveCardList(
        args.query as Parameters<typeof client.cards.retrieveCardList>[0],
        options,
      ),
    }),
  );
  registry.add(
    'cards.retrieveCardLocationHistory',
    'Retrieve card location history (cards); full API fields and JSON response.',
    z.strictObject({card_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cards.retrieveCardLocationHistory(
        args.card_id,
        options,
      ),
    }),
  );
  registry.add(
    'cards.updateCard',
    'Update card (cards); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      body: cardUpdateBody,
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cards.updateCard(
        args.card_id,
        args.body as Parameters<typeof client.cards.updateCard>[1],
        options,
      ),
    }),
  );
  registry.add(
    'cards.create',
    'Create (cards); full API fields and JSON response.',
    z.strictObject({
      body: cardCreateBody,
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cards.create(
        args.body as Parameters<typeof client.cards.create>[0],
        options,
      ),
    }),
  );
}
