import * as z from 'zod/v4';
import {id, pageFields, text} from '../schemas.ts';
import {read, change, type ToolRegistry} from '../tool-registry.ts';
import {apiResult, collectItems} from '../results.ts';

export function registerCardTypesAndTags(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'cardTypeTreeEntities.addTreeEntityToCardType',
    'Add tree entity to card type (cardTypeTreeEntities); full API fields and JSON response.',
    z.strictObject({type_id: id, tree_entity_uid: text}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardTypeTreeEntities.addTreeEntityToCardType(
        args.type_id,
        args.tree_entity_uid,
        options,
      ),
    }),
  );
  registry.add(
    'cardTypeTreeEntities.deleteTreeEntityFromCardType',
    'Delete tree entity from card type (cardTypeTreeEntities); full API fields and JSON response.',
    z.strictObject({type_id: id, uid: text}),
    apiResult,
    change,
    async (args, options) => ({
      result:
        (await client.cardTypeTreeEntities.deleteTreeEntityFromCardType(
          args.type_id,
          args.uid,
          options,
        )) ?? null,
    }),
  );
  registry.add(
    'cardTypeTreeEntities.getListOfTypeTreeEntities',
    'Get list of type tree entities (cardTypeTreeEntities); full API fields and JSON response.',
    z.strictObject({type_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cardTypeTreeEntities.getListOfTypeTreeEntities(
        args.type_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardTypes.createNewCardType',
    'Create new card type (cardTypes); full API fields and JSON response.',
    z.strictObject({
      body: z.strictObject({
        letter: z.string(),
        name: z.string(),
        color: z.number(),
        properties: z.record(z.string(), z.json()).optional(),
        card_properties: z.array(z.json()).optional(),
        suggest_fields: z.boolean().optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardTypes.createNewCardType(
        args.body as Parameters<typeof client.cardTypes.createNewCardType>[0],
        options,
      ),
    }),
  );
  registry.add(
    'cardTypes.getCardType',
    'Get card type (cardTypes); full API fields and JSON response.',
    z.strictObject({id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cardTypes.getCardType(args.id, options),
    }),
  );
  registry.add(
    'cardTypes.getListOfCardTypes',
    'Get list of card types (cardTypes); full API fields and JSON response.',
    z.strictObject({
      limit: pageFields.limit.removeDefault().optional(),
      offset: pageFields.offset.removeDefault().optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cardTypes.getListOfCardTypes(
        args.limit,
        args.offset,
        options,
      ),
    }),
  );
  registry.add(
    'cardTypes.removeCardType',
    'Remove card type (cardTypes); full API fields and JSON response.',
    z.strictObject({id: id, replace_type_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardTypes.removeCardType(
        args.id,
        args.replace_type_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardTypes.updateCardType',
    'Update card type (cardTypes); full API fields and JSON response.',
    z.strictObject({
      id: id,
      body: z
        .strictObject({
          letter: z.string().optional(),
          name: z.string().optional(),
          color: z.number().optional(),
          properties: z.record(z.string(), z.json()).optional(),
          card_properties: z
            .array(
              z.strictObject({
                regular_property: z
                  .union([
                    z.literal('description'),
                    z.literal('due_date'),
                    z.literal('tags'),
                    z.literal('size'),
                    z.literal('timeline'),
                  ])
                  .nullable()
                  .optional(),
                property_uid: text.nullable().optional(),
                sort_order: z.number().optional(),
                required: z.boolean().optional(),
                type_uid: text.optional(),
              }),
            )
            .optional(),
          suggest_fields: z.boolean().optional(),
        })
        .refine(
          value =>
            value['name'] !== undefined ||
            value['letter'] !== undefined ||
            value['color'] !== undefined ||
            value['properties'] !== undefined,
          'Supply at least one of: name, letter, color, properties.',
        ),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardTypes.updateCardType(
        args.id,
        args.body as Parameters<typeof client.cardTypes.updateCardType>[1],
        options,
      ),
    }),
  );
  registry.add(
    'tags.iterate',
    'Collect a bounded snapshot through the public client iterator; returns items and truncated.',
    z.strictObject({
      query: z
        .strictObject({
          limit: pageFields.limit.removeDefault().optional(),
          offset: pageFields.offset.removeDefault().optional(),
          space_id: id.optional(),
          ids: z.union([z.string(), z.array(id)]).optional(),
          query: z.string().optional(),
        })
        .optional(),
      max_items: z.number().int().min(1).max(1_000).default(100),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await collectItems(
        client.tags.iterate(
          args.query as Parameters<typeof client.tags.iterate>[0],
          options,
        ),
        args.max_items,
      ),
    }),
  );
  registry.add(
    'tags.addTag',
    'Add tag (tags); full API fields and JSON response.',
    z.strictObject({
      name: z.string(),
      query: z
        .strictObject({
          ids: z.string().optional(),
          query: z.string().optional(),
          space_id: id.optional(),
          limit: pageFields.limit.removeDefault().optional(),
          offset: pageFields.offset.removeDefault().optional(),
        })
        .optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.tags.addTag(
        args.name,
        args.query as Parameters<typeof client.tags.addTag>[1],
        options,
      ),
    }),
  );
  registry.add(
    'tags.retrieveListOfTags',
    'Retrieve list of tags (tags); full API fields and JSON response.',
    z.strictObject({
      query: z
        .strictObject({
          limit: pageFields.limit.removeDefault().optional(),
          offset: pageFields.offset.removeDefault().optional(),
          space_id: id.optional(),
          ids: z.union([z.string(), z.array(id)]).optional(),
          query: z.string().optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.tags.retrieveListOfTags(
        args.query as Parameters<typeof client.tags.retrieveListOfTags>[0],
        options,
      ),
    }),
  );
}
