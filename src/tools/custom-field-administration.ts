import * as z from 'zod/v4';
import {hasChanges, id, pageFields, text} from '../schemas.ts';
import {read, change, type ToolRegistry} from '../tool-registry.ts';
import {apiResult} from '../results.ts';

export function registerCustomFieldAdministration(
  registry: ToolRegistry,
): void {
  const {client} = registry;
  registry.add(
    'customProperties.createNewProperty',
    'Create new property (customProperties); full API fields and JSON response.',
    z.strictObject({
      body: z
        .strictObject({
          name: z.string().optional(),
          show_on_facade: z.boolean().optional(),
          multiline: z.boolean().optional(),
          vote_variant: z
            .union([
              z.literal('rating'),
              z.literal('scale'),
              z.literal('emoji_set'),
            ])
            .nullable()
            .optional(),
          type: z
            .union([
              z.literal('string'),
              z.literal('number'),
              z.literal('url'),
              z.literal('formula'),
              z.literal('date'),
              z.literal('email'),
              z.literal('phone'),
              z.literal('checkbox'),
              z.literal('select'),
              z.literal('collective_score'),
              z.literal('vote'),
              z.literal('collective_vote'),
              z.literal('catalog'),
              z.literal('user'),
              z.literal('attachment'),
            ])
            .optional(),
          values_type: z
            .union([z.literal('number'), z.literal('text')])
            .nullable()
            .optional(),
          colorful: z.boolean().nullable().optional(),
          multi_select: z.boolean().nullable().optional(),
          values_creatable_by_users: z.boolean().nullable().optional(),
          data: z
            .strictObject({
              restrictions: z
                .strictObject({
                  min: z.number().nullable().optional(),
                  max: z.number().nullable().optional(),
                  minLength: z.number().nullable().optional(),
                  maxLength: z.number().nullable().optional(),
                  maxFilesCount: z.number().nullable().optional(),
                  filesExtensions: z.string().nullable().optional(),
                })
                .optional(),
              formula: z.string().optional(),
              emoji: z.string().optional(),
              count: z.number().optional(),
              emojis: z.array(z.string()).optional(),
              min: z.number().optional(),
              max: z.number().optional(),
              calculation_method: z
                .union([z.literal('average'), z.literal('sum')])
                .optional(),
            })
            .optional(),
          formula: z.string().optional(),
          formula_source_card: z.record(z.string(), z.json()).optional(),
          color: z.number().nullable().optional(),
          fields_settings: z.record(z.string(), z.json()).optional(),
        })
        .refine(
          value =>
            (value.name !== undefined && value.type !== undefined) ||
            (value.formula !== undefined &&
              value.formula_source_card !== undefined),
          'Supply name and type, or formula and formula_source_card.',
        ),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customProperties.createNewProperty(
        args.body as Parameters<
          typeof client.customProperties.createNewProperty
        >[0],
        options,
      ),
    }),
  );
  registry.add(
    'customProperties.getListOfProperties',
    'Get list of properties (customProperties); full API fields and JSON response.',
    z.strictObject({
      query: z
        .strictObject({
          include_values: z.boolean().optional(),
          include_author: z.boolean().optional(),
          compact: z.boolean().optional(),
          load_by_ids: z.boolean().optional(),
          ids: z
            .array(z.union([z.string(), z.number(), z.boolean()]))
            .optional(),
          offset: pageFields.offset.removeDefault().optional(),
          limit: pageFields.limit.removeDefault().optional(),
          order_by: z.string().optional(),
          order_direction: z.string().optional(),
          query: z.string().optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.customProperties.getListOfProperties(
        args.query as Parameters<
          typeof client.customProperties.getListOfProperties
        >[0],
        options,
      ),
    }),
  );
  registry.add(
    'customProperties.getProperty',
    'Get property (customProperties); full API fields and JSON response.',
    z.strictObject({property_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.customProperties.getProperty(
        args.property_id,
        options,
      ),
    }),
  );
  registry.add(
    'customProperties.removeProperty',
    'Remove property (customProperties); full API fields and JSON response.',
    z.strictObject({property_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customProperties.removeProperty(
        args.property_id,
        options,
      ),
    }),
  );
  registry.add(
    'customProperties.updateProperty',
    'Update property (customProperties); full API fields and JSON response.',
    z.strictObject({
      property_id: id,
      body: z.strictObject({
        name: z.string().optional(),
        show_on_facade: z.boolean().optional(),
        multiline: z.boolean().optional(),
        condition: z
          .union([z.literal('active'), z.literal('inactive')])
          .optional(),
        colorful: z.boolean().nullable().optional(),
        multi_select: z.boolean().nullable().optional(),
        values_creatable_by_users: z.boolean().nullable().optional(),
        data: z.json().optional(),
        color: z.number().nullable().optional(),
        fields_settings: z.record(z.string(), z.json()).nullable().optional(),
        is_used_as_progress: z.boolean().optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customProperties.updateProperty(
        args.property_id,
        args.body as Parameters<
          typeof client.customProperties.updateProperty
        >[1],
        options,
      ),
    }),
  );
  registry.add(
    'customPropertyCatalogValues.createNewCatalogValue',
    'Create new catalog value (customPropertyCatalogValues); full API fields and JSON response.',
    z.strictObject({
      property_id: id,
      body: z.strictObject({value: z.record(z.string(), z.json())}),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customPropertyCatalogValues.createNewCatalogValue(
        args.property_id,
        args.body as Parameters<
          typeof client.customPropertyCatalogValues.createNewCatalogValue
        >[1],
        options,
      ),
    }),
  );
  registry.add(
    'customPropertyCatalogValues.getCatalogValue',
    'Get catalog value (customPropertyCatalogValues); full API fields and JSON response.',
    z.strictObject({property_id: id, value_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.customPropertyCatalogValues.getCatalogValue(
        args.property_id,
        args.value_id,
        options,
      ),
    }),
  );
  registry.add(
    'customPropertyCatalogValues.getListOfCatalogValues',
    'Get list of catalog values (customPropertyCatalogValues); full API fields and JSON response.',
    z.strictObject({
      property_id: id,
      query: z
        .strictObject({
          query: z.string().optional(),
          conditions: z.string().optional(),
          limit: pageFields.limit.removeDefault().optional(),
          offset: pageFields.offset.removeDefault().optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.customPropertyCatalogValues.getListOfCatalogValues(
        args.property_id,
        args.query as Parameters<
          typeof client.customPropertyCatalogValues.getListOfCatalogValues
        >[1],
        options,
      ),
    }),
  );
  registry.add(
    'customPropertyCatalogValues.removeProperty',
    'Remove property (customPropertyCatalogValues); full API fields and JSON response.',
    z.strictObject({property_id: id, value_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customPropertyCatalogValues.removeProperty(
        args.property_id,
        args.value_id,
        options,
      ),
    }),
  );
  registry.add(
    'customPropertyCatalogValues.updateCatalogValue',
    'Update catalog value (customPropertyCatalogValues); full API fields and JSON response.',
    z.strictObject({
      property_id: id,
      value_id: id,
      body: z
        .strictObject({
          condition: z
            .union([z.literal('active'), z.literal('inactive')])
            .optional(),
          value: z.record(z.string(), z.json()).optional(),
          deleted: z.boolean().optional(),
        })
        .refine(
          value => value.condition !== undefined || value.value !== undefined,
          'Supply at least one of: condition, value.',
        ),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customPropertyCatalogValues.updateCatalogValue(
        args.property_id,
        args.value_id,
        args.body as Parameters<
          typeof client.customPropertyCatalogValues.updateCatalogValue
        >[2],
        options,
      ),
    }),
  );
  registry.add(
    'customPropertyCollectiveScoreValues.createNewScoreValue',
    'Create new score value (customPropertyCollectiveScoreValues); full API fields and JSON response.',
    z.strictObject({card_id: id, property_id: id, value: z.string()}),
    apiResult,
    change,
    async (args, options) => ({
      result:
        await client.customPropertyCollectiveScoreValues.createNewScoreValue(
          args.card_id,
          args.property_id,
          args.value,
          options,
        ),
    }),
  );
  registry.add(
    'customPropertyCollectiveScoreValues.getListOfScoreValues',
    'Get list of score values (customPropertyCollectiveScoreValues); full API fields and JSON response.',
    z.strictObject({card_id: id, property_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result:
        await client.customPropertyCollectiveScoreValues.getListOfScoreValues(
          args.card_id,
          args.property_id,
          options,
        ),
    }),
  );
  registry.add(
    'customPropertyCollectiveScoreValues.updateScoreValue',
    'Update score value (customPropertyCollectiveScoreValues); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      property_id: id,
      value_id: id,
      value: z.string().nullable(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customPropertyCollectiveScoreValues.updateScoreValue(
        args.card_id,
        args.property_id,
        args.value_id,
        args.value,
        options,
      ),
    }),
  );
  registry.add(
    'customPropertyCollectiveVoteValues.createNewVoteValue',
    'Create new vote value (customPropertyCollectiveVoteValues); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      property_id: id,
      body: z
        .strictObject({
          emoji_vote: z.string().optional(),
          number_vote: z.number().optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result:
        await client.customPropertyCollectiveVoteValues.createNewVoteValue(
          args.card_id,
          args.property_id,
          args.body as Parameters<
            typeof client.customPropertyCollectiveVoteValues.createNewVoteValue
          >[2],
          options,
        ),
    }),
  );
  registry.add(
    'customPropertyCollectiveVoteValues.getListOfVoteValues',
    'Get list of vote values (customPropertyCollectiveVoteValues); full API fields and JSON response.',
    z.strictObject({card_id: id, property_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result:
        await client.customPropertyCollectiveVoteValues.getListOfVoteValues(
          args.card_id,
          args.property_id,
          options,
        ),
    }),
  );
  registry.add(
    'customPropertyCollectiveVoteValues.removeVoteValue',
    'Remove vote value (customPropertyCollectiveVoteValues); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      property_id: id,
      id: id,
      emoji_vote: z.string(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customPropertyCollectiveVoteValues.removeVoteValue(
        args.card_id,
        args.property_id,
        args.id,
        args.emoji_vote,
        options,
      ),
    }),
  );
  registry.add(
    'customPropertyCollectiveVoteValues.updateVoteValue',
    'Update vote value (customPropertyCollectiveVoteValues); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      property_id: id,
      id: id,
      number_vote: z.number().nullable().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customPropertyCollectiveVoteValues.updateVoteValue(
        args.card_id,
        args.property_id,
        args.id,
        args.number_vote,
        options,
      ),
    }),
  );
  registry.add(
    'customPropertySelectValues.createNewSelectValue',
    'Create new select value (customPropertySelectValues); full API fields and JSON response.',
    z.strictObject({
      property_id: id,
      value: z.string(),
      color: z.number().nullable().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customPropertySelectValues.createNewSelectValue(
        args.property_id,
        args.value,
        args.color,
        options,
      ),
    }),
  );
  registry.add(
    'customPropertySelectValues.getListOfSelectValues',
    'Get list of select values (customPropertySelectValues); full API fields and JSON response.',
    z.strictObject({
      property_id: id,
      query: z
        .strictObject({
          v2_select_search: z.boolean().optional(),
          query: z.string().optional(),
          order_by: z.string().optional(),
          ids: z
            .array(z.union([z.string(), z.number(), z.boolean()]))
            .optional(),
          conditions: z
            .array(
              z.union([
                z.literal('active'),
                z.literal('inactive'),
                z.literal('removed'),
              ]),
            )
            .optional(),
          offset: pageFields.offset.removeDefault().optional(),
          limit: pageFields.limit.removeDefault().optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.customPropertySelectValues.getListOfSelectValues(
        args.property_id,
        args.query as Parameters<
          typeof client.customPropertySelectValues.getListOfSelectValues
        >[1],
        options,
      ),
    }),
  );
  registry.add(
    'customPropertySelectValues.getSelectValue',
    'Get select value (customPropertySelectValues); full API fields and JSON response.',
    z.strictObject({property_id: id, value_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.customPropertySelectValues.getSelectValue(
        args.property_id,
        args.value_id,
        options,
      ),
    }),
  );
  registry.add(
    'customPropertySelectValues.removeProperty',
    'Remove property (customPropertySelectValues); full API fields and JSON response.',
    z.strictObject({property_id: id, value_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customPropertySelectValues.removeProperty(
        args.property_id,
        args.value_id,
        options,
      ),
    }),
  );
  registry.add(
    'customPropertySelectValues.updateSelectValue',
    'Update select value (customPropertySelectValues); full API fields and JSON response.',
    z.strictObject({
      property_id: id,
      value_id: id,
      body: z
        .strictObject({
          value: z.string().optional(),
          color: z.number().nullable().optional(),
          condition: z
            .union([z.literal('active'), z.literal('inactive')])
            .optional(),
          sort_order: z.number().optional(),
          deleted: z.boolean().optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customPropertySelectValues.updateSelectValue(
        args.property_id,
        args.value_id,
        args.body as Parameters<
          typeof client.customPropertySelectValues.updateSelectValue
        >[2],
        options,
      ),
    }),
  );
  registry.add(
    'customPropertyTreeEntities.addTreeEntityToCustomProperty',
    'Add tree entity to custom property (customPropertyTreeEntities); full API fields and JSON response.',
    z.strictObject({property_id: id, tree_entity_uid: text}),
    apiResult,
    change,
    async (args, options) => ({
      result:
        await client.customPropertyTreeEntities.addTreeEntityToCustomProperty(
          args.property_id,
          args.tree_entity_uid,
          options,
        ),
    }),
  );
  registry.add(
    'customPropertyTreeEntities.deleteTreeEntityFromCustomProperty',
    'Delete tree entity from custom property (customPropertyTreeEntities); full API fields and JSON response.',
    z.strictObject({property_id: id, uid: text}),
    apiResult,
    change,
    async (args, options) => ({
      result:
        (await client.customPropertyTreeEntities.deleteTreeEntityFromCustomProperty(
          args.property_id,
          args.uid,
          options,
        )) ?? null,
    }),
  );
  registry.add(
    'customPropertyTreeEntities.getListOfCustomPropertyTreeEntities',
    'Get list of custom property tree entities (customPropertyTreeEntities); full API fields and JSON response.',
    z.strictObject({property_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result:
        await client.customPropertyTreeEntities.getListOfCustomPropertyTreeEntities(
          args.property_id,
          options,
        ),
    }),
  );
}
