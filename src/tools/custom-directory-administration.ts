import * as z from 'zod/v4';
import {defined, pageFields, text, uuid} from '../schemas.ts';
import {read, change, type ToolRegistry} from '../tool-registry.ts';
import {apiResult} from '../results.ts';
import {
  directoryFilters,
  encodeDirectoryFilters,
} from '../directory-filters.ts';

export function registerCustomDirectoryAdministration(
  registry: ToolRegistry,
): void {
  const {client} = registry;
  registry.add(
    'customDirectories.createCustomDirectory',
    'Create custom directory (customDirectories); full API fields and JSON response.',
    z.strictObject({
      body: z.strictObject({
        name: z.string(),
        description: z.string().nullable().optional(),
        multi_select: z.boolean().optional(),
        allow_editing: z.boolean().optional(),
        display_field_index: z.number().int().nonnegative().optional(),
        fields: z
          .array(
            z.strictObject({
              name: z.string(),
              type: z.union([
                z.literal('string'),
                z.literal('number'),
                z.literal('url'),
                z.literal('date'),
                z.literal('email'),
                z.literal('phone'),
                z.literal('checkbox'),
                z.literal('select'),
                z.literal('catalog'),
                z.literal('user'),
                z.literal('directory_link'),
                z.literal('file'),
              ]),
              required: z.boolean().optional(),
              sort_order: z.number().optional(),
              custom_property_uid: text.nullable().optional(),
              linked_directory_id: uuid.nullable().optional(),
            }),
          )
          .optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customDirectories.createCustomDirectory(
        args.body as Parameters<
          typeof client.customDirectories.createCustomDirectory
        >[0],
        options,
      ),
    }),
  );
  registry.add(
    'customDirectories.deleteCustomDirectory',
    'Delete custom directory (customDirectories); full API fields and JSON response.',
    z.strictObject({directory_id: uuid}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customDirectories.deleteCustomDirectory(
        args.directory_id,
        options,
      ),
    }),
  );
  registry.add(
    'customDirectories.getCustomDirectory',
    'Get custom directory (customDirectories); full API fields and JSON response.',
    z.strictObject({directory_id: uuid}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.customDirectories.getCustomDirectory(
        args.directory_id,
        options,
      ),
    }),
  );
  registry.add(
    'customDirectories.getListOfCustomDirectories',
    'Get list of custom directories (customDirectories); full API fields and JSON response.',
    z.strictObject({
      query: z
        .strictObject({
          include_fields: z.boolean().optional(),
          include_author: z.boolean().optional(),
          include_records_count: z.boolean().optional(),
          limit: pageFields.limit.removeDefault().optional(),
          offset: pageFields.offset.removeDefault().optional(),
          query: z.string().optional(),
          conditions: z
            .array(
              z.union([
                z.literal('active'),
                z.literal('inactive'),
                z.literal('removed'),
              ]),
            )
            .optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.customDirectories.getListOfCustomDirectories(
        args.query as Parameters<
          typeof client.customDirectories.getListOfCustomDirectories
        >[0],
        options,
      ),
    }),
  );
  registry.add(
    'customDirectories.updateCustomDirectory',
    'Update custom directory (customDirectories); full API fields and JSON response.',
    z.strictObject({
      directory_id: uuid,
      body: z
        .strictObject({
          expected_field_ids: z.array(uuid).optional(),
          name: z.string().optional(),
          description: z.string().nullable().optional(),
          condition: z
            .union([
              z.literal('active'),
              z.literal('inactive'),
              z.literal('removed'),
            ])
            .optional(),
          multi_select: z.boolean().optional(),
          allow_editing: z.boolean().optional(),
          fields: z
            .array(
              z.strictObject({
                id: uuid.optional(),
                name: z.string().optional(),
                type: z
                  .union([
                    z.literal('string'),
                    z.literal('number'),
                    z.literal('url'),
                    z.literal('date'),
                    z.literal('email'),
                    z.literal('phone'),
                    z.literal('checkbox'),
                    z.literal('select'),
                    z.literal('catalog'),
                    z.literal('user'),
                    z.literal('directory_link'),
                    z.literal('file'),
                  ])
                  .optional(),
                required: z.boolean().optional(),
                is_display: z.boolean().optional(),
                sort_order: z.number().optional(),
                custom_property_uid: text.nullable().optional(),
                linked_directory_id: uuid.nullable().optional(),
              }),
            )
            .optional(),
        })
        .refine(
          value =>
            value.expected_field_ids === undefined ||
            value.fields !== undefined,
          'expected_field_ids must accompany the complete fields list.',
        ),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customDirectories.updateCustomDirectory(
        args.directory_id,
        args.body as Parameters<
          typeof client.customDirectories.updateCustomDirectory
        >[1],
        options,
      ),
    }),
  );
  registry.add(
    'customDirectoryFields.createField',
    'Create field (customDirectoryFields); full API fields and JSON response.',
    z.strictObject({
      directory_id: uuid,
      body: z.strictObject({
        name: z.string(),
        type: z.union([
          z.literal('string'),
          z.literal('number'),
          z.literal('url'),
          z.literal('date'),
          z.literal('email'),
          z.literal('phone'),
          z.literal('checkbox'),
          z.literal('select'),
          z.literal('catalog'),
          z.literal('user'),
          z.literal('directory_link'),
          z.literal('file'),
        ]),
        sort_order: z.number().optional(),
        required: z.boolean().optional(),
        is_display: z.boolean().optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customDirectoryFields.createField(
        args.directory_id,
        args.body as Parameters<
          typeof client.customDirectoryFields.createField
        >[1],
        options,
      ),
    }),
  );
  registry.add(
    'customDirectoryFields.deleteField',
    'Delete field (customDirectoryFields); full API fields and JSON response.',
    z.strictObject({directory_id: uuid, field_id: uuid}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customDirectoryFields.deleteField(
        args.directory_id,
        args.field_id,
        options,
      ),
    }),
  );
  registry.add(
    'customDirectoryFields.getField',
    'Get field (customDirectoryFields); full API fields and JSON response.',
    z.strictObject({directory_id: uuid, field_id: uuid}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.customDirectoryFields.getField(
        args.directory_id,
        args.field_id,
        options,
      ),
    }),
  );
  registry.add(
    'customDirectoryFields.getListOfFields',
    'Get list of fields (customDirectoryFields); full API fields and JSON response.',
    z.strictObject({
      directory_id: uuid,
      include_author: z.boolean().optional(),
      conditions: z
        .array(
          z.union([
            z.literal('active'),
            z.literal('inactive'),
            z.literal('removed'),
          ]),
        )
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.customDirectoryFields.getListOfFields(
        args.directory_id,
        args.include_author,
        args.conditions,
        options,
      ),
    }),
  );
  registry.add(
    'customDirectoryFields.updateField',
    'Update field (customDirectoryFields); full API fields and JSON response.',
    z.strictObject({
      directory_id: uuid,
      field_id: uuid,
      body: z.strictObject({
        name: z.string().optional(),
        condition: z
          .union([
            z.literal('active'),
            z.literal('inactive'),
            z.literal('removed'),
          ])
          .optional(),
        sort_order: z.number().optional(),
        required: z.boolean().optional(),
        is_display: z.boolean().optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customDirectoryFields.updateField(
        args.directory_id,
        args.field_id,
        args.body as Parameters<
          typeof client.customDirectoryFields.updateField
        >[2],
        options,
      ),
    }),
  );
  registry.add(
    'customDirectoryRecords.createRecord',
    'Create record (customDirectoryRecords); full API fields and JSON response.',
    z.strictObject({
      directory_id: uuid,
      body: z.strictObject({values: z.record(z.string(), z.json())}),
      response_profile: z.string().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customDirectoryRecords.createRecord(
        args.directory_id,
        args.body as Parameters<
          typeof client.customDirectoryRecords.createRecord
        >[1],
        args.response_profile,
        options,
      ),
    }),
  );
  registry.add(
    'customDirectoryRecords.deleteRecord',
    'Delete record (customDirectoryRecords); full API fields and JSON response.',
    z.strictObject({directory_id: uuid, record_id: uuid}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customDirectoryRecords.deleteRecord(
        args.directory_id,
        args.record_id,
        options,
      ),
    }),
  );
  registry.add(
    'customDirectoryRecords.getCardsLinkedToRecord',
    'Get cards linked to record (customDirectoryRecords); full API fields and JSON response.',
    z.strictObject({
      directory_id: uuid,
      record_id: uuid,
      query: z
        .strictObject({
          limit: pageFields.limit.removeDefault().optional(),
          offset: pageFields.offset.removeDefault().optional(),
          filter: z.string().optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.customDirectoryRecords.getCardsLinkedToRecord(
        args.directory_id,
        args.record_id,
        args.query as Parameters<
          typeof client.customDirectoryRecords.getCardsLinkedToRecord
        >[2],
        options,
      ),
    }),
  );
  registry.add(
    'customDirectoryRecords.getListOfRecords',
    'Get list of records (customDirectoryRecords); full API fields and JSON response.',
    z.strictObject({
      directory_id: uuid,
      query: z
        .strictObject({
          limit: pageFields.limit.removeDefault().optional(),
          offset: pageFields.offset.removeDefault().optional(),
          query: z.string().optional(),
          profile: z.string().optional(),
          include_values: z.boolean().optional(),
          include_author: z.boolean().optional(),
          conditions: z
            .array(
              z.union([
                z.literal('active'),
                z.literal('inactive'),
                z.literal('removed'),
              ]),
            )
            .optional(),
          filters: directoryFilters.optional(),
          filter_operator: z.string().optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => {
      const {filters, ...query} = args.query ?? {};
      // The endpoint requires bracket parameters; the client's JSON filters are ignored upstream.
      return {
        result: await client.customDirectoryRecords.getListOfRecords(
          args.directory_id,
          defined({...query, ...encodeDirectoryFilters(filters)}),
          options,
        ),
      };
    },
  );
  registry.add(
    'customDirectoryRecords.getRecord',
    'Get record (customDirectoryRecords); full API fields and JSON response.',
    z.strictObject({
      directory_id: uuid,
      record_id: uuid,
      profile: z.string().optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.customDirectoryRecords.getRecord(
        args.directory_id,
        args.record_id,
        args.profile,
        options,
      ),
    }),
  );
  registry.add(
    'customDirectoryRecords.updateRecord',
    'Update record (customDirectoryRecords); full API fields and JSON response.',
    z.strictObject({
      directory_id: uuid,
      record_id: uuid,
      body: z.strictObject({
        condition: z
          .union([
            z.literal('active'),
            z.literal('inactive'),
            z.literal('removed'),
          ])
          .optional(),
        values: z.record(z.string(), z.json()).optional(),
      }),
      response_profile: z.string().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.customDirectoryRecords.updateRecord(
        args.directory_id,
        args.record_id,
        args.body as Parameters<
          typeof client.customDirectoryRecords.updateRecord
        >[2],
        args.response_profile,
        options,
      ),
    }),
  );
}
