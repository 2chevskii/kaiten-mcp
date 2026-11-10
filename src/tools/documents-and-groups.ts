import * as z from 'zod/v4';
import {documentData} from '../document-schemas.ts';
import {hasChanges, pageFields, text} from '../schemas.ts';
import {read, change, type ToolRegistry} from '../tool-registry.ts';
import {apiResult, collectItems} from '../results.ts';

export function registerDocumentsAndGroups(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'documentGroups.iterate',
    'Collect a bounded snapshot through the public client iterator; returns items and truncated.',
    z.strictObject({
      query: z
        .strictObject({
          condition: z.number().optional(),
          query: z.string().optional(),
          limit: pageFields.limit.removeDefault().optional(),
          start_position: z.string().optional(),
          role: z.number().optional(),
        })
        .optional(),
      max_items: z.number().int().min(1).max(1_000).default(100),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await collectItems(
        client.documentGroups.iterate(
          args.query as Parameters<typeof client.documentGroups.iterate>[0],
          options,
        ),
        args.max_items,
      ),
    }),
  );
  registry.add(
    'documentGroups.createNewDocumentGroup',
    'Create new document group (documentGroups); full API fields and JSON response.',
    z.strictObject({
      body: z.strictObject({
        title: z.string(),
        parent_entity_uid: text.nullable().optional(),
        for_everyone_access_role_id: text.nullable().optional(),
        sort_order: z.number().optional(),
        key: z.string().nullable().optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.documentGroups.createNewDocumentGroup(
        args.body as Parameters<
          typeof client.documentGroups.createNewDocumentGroup
        >[0],
        options,
      ),
    }),
  );
  registry.add(
    'documentGroups.removeDocumentGroup',
    'Remove document group (documentGroups); full API fields and JSON response.',
    z.strictObject({document_group_uid: text}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.documentGroups.removeDocumentGroup(
        args.document_group_uid,
        options,
      ),
    }),
  );
  registry.add(
    'documentGroups.retrieveDocumentGroup',
    'Retrieve document group (documentGroups); full API fields and JSON response.',
    z.strictObject({document_group_uid: text}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.documentGroups.retrieveDocumentGroup(
        args.document_group_uid,
        options,
      ),
    }),
  );
  registry.add(
    'documentGroups.retrieveListOfDocumentGroups',
    'Retrieve list of document groups (documentGroups); full API fields and JSON response.',
    z.strictObject({
      query: z
        .strictObject({
          query: z.string().optional(),
          offset: pageFields.offset.removeDefault().optional(),
          limit: pageFields.limit.removeDefault().optional(),
          version: z.union([z.literal(1), z.literal(2)]).optional(),
          condition: z.number().optional(),
          start_position: z.string().optional(),
          role: z.number().optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.documentGroups.retrieveListOfDocumentGroups(
        args.query as Parameters<
          typeof client.documentGroups.retrieveListOfDocumentGroups
        >[0],
        options,
      ),
    }),
  );
  registry.add(
    'documentGroups.updateDocumentGroup',
    'Update document group (documentGroups); full API fields and JSON response.',
    z.strictObject({
      document_group_uid: text,
      body: z
        .strictObject({
          title: z.string().optional(),
          parent_entity_uid: text.nullable().optional(),
          sort_order: z.number().optional(),
          access: z
            .union([z.literal('for_everyone'), z.literal('by_invite')])
            .optional(),
          for_everyone_access_role_id: text.nullable().optional(),
          hostname: z.string().nullable().optional(),
          redirect_url: z.string().nullable().optional(),
          key: z.string().nullable().optional(),
          icon_type: z.literal('material_icon').nullable().optional(),
          icon_value: z.string().nullable().optional(),
          icon_color: z.number().nullable().optional(),
          hidden_on_public_site: z.boolean().optional(),
          news_feed: z.boolean().optional(),
          index_document_uid: text.nullable().optional(),
        })
        .refine(
          value =>
            value['title'] !== undefined ||
            value['sort_order'] !== undefined ||
            value['access'] !== undefined ||
            value['parent_entity_uid'] !== undefined ||
            value['hostname'] !== undefined ||
            value['key'] !== undefined ||
            value['icon_type'] !== undefined ||
            value['hidden_on_public_site'] !== undefined ||
            value['news_feed'] !== undefined ||
            value['index_document_uid'] !== undefined,
          'Supply at least one of: title, sort_order, access, parent_entity_uid, hostname, key, icon_type, hidden_on_public_site, news_feed, index_document_uid.',
        ),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.documentGroups.updateDocumentGroup(
        args.document_group_uid,
        args.body as Parameters<
          typeof client.documentGroups.updateDocumentGroup
        >[1],
        options,
      ),
    }),
  );
  registry.add(
    'documentSchemas.getDocumentDataSchema',
    'Get document data schema (documentSchemas); full API fields and JSON response.',
    z.strictObject({
      schema_version: text,
      format: z
        .union([z.literal('draft-06'), z.literal('prosemirror')])
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.documentSchemas.getDocumentDataSchema(
        args.schema_version,
        args.format,
        options,
      ),
    }),
  );
  registry.add(
    'documents.iterate',
    'Collect a bounded snapshot through the public client iterator; returns items and truncated.',
    z.strictObject({
      query: z
        .strictObject({
          condition: z.number().optional(),
          query: z.string().optional(),
          limit: pageFields.limit.removeDefault().optional(),
          start_position: z.string().optional(),
          include_search_preview: z.boolean().optional(),
          fields: z.string().optional(),
        })
        .optional(),
      max_items: z.number().int().min(1).max(1_000).default(100),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await collectItems(
        client.documents.iterate(
          args.query as Parameters<typeof client.documents.iterate>[0],
          options,
        ),
        args.max_items,
      ),
    }),
  );
  registry.add(
    'documents.createNewDocument',
    'Create new document (documents); full API fields and JSON response.',
    z.strictObject({
      body: z.strictObject({
        title: z.string().optional(),
        sort_order: z.number(),
        parent_entity_uid: text.nullable().optional(),
        for_everyone_access_role_id: text.optional(),
        clone_uid: text.optional(),
        clone_version: z.number().optional(),
        key: z.string().nullable().optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.documents.createNewDocument(
        args.body as Parameters<typeof client.documents.createNewDocument>[0],
        options,
      ),
    }),
  );
  registry.add(
    'documents.removeDocument',
    'Remove document (documents); full API fields and JSON response.',
    z.strictObject({document_uid: text}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.documents.removeDocument(args.document_uid, options),
    }),
  );
  registry.add(
    'documents.retrieveDocument',
    'Retrieve document (documents); full API fields and JSON response.',
    z.strictObject({document_uid: text}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.documents.retrieveDocument(
        args.document_uid,
        options,
      ),
    }),
  );
  registry.add(
    'documents.retrieveListOfDocuments',
    'Retrieve list of documents (documents); full API fields and JSON response.',
    z.strictObject({
      query: z
        .strictObject({
          query: z.string().optional(),
          offset: pageFields.offset.removeDefault().optional(),
          limit: pageFields.limit.removeDefault().optional(),
          version: z.union([z.literal(1), z.literal(2)]).optional(),
          condition: z.number().optional(),
          fields: z.string().optional(),
          start_position: z.string().optional(),
          include_search_preview: z.boolean().optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.documents.retrieveListOfDocuments(
        args.query as Parameters<
          typeof client.documents.retrieveListOfDocuments
        >[0],
        options,
      ),
    }),
  );
  registry.add(
    'documents.updateDocument',
    'Update document (documents); full API fields and JSON response.',
    z.strictObject({
      document_uid: text,
      body: z
        .strictObject({
          title: z.string().optional(),
          sort_order: z.number().optional(),
          publish_date: z.string().nullable().optional(),
          data: documentData.optional(),
          access: z
            .union([z.literal('for_everyone'), z.literal('by_invite')])
            .optional(),
          parent_entity_uid: text.nullable().optional(),
          for_everyone_access_role_id: text.optional(),
          public: z.boolean().optional(),
          redirect_url: z.string().nullable().optional(),
          hidden_on_public_site: z.boolean().optional(),
          settings: z
            .strictObject({
              content_width: z
                .union([z.literal('default'), z.literal('wide')])
                .optional(),
            })
            .optional(),
          backup_version: z.number().optional(),
          published_version: z
            .union([z.number(), z.literal('current')])
            .nullable()
            .optional(),
          key: z.string().nullable().optional(),
          icon_type: z
            .union([z.literal('material_icon'), z.literal('emoji')])
            .nullable()
            .optional(),
          icon_value: z.string().nullable().optional(),
          icon_color: z.number().nullable().optional(),
          notification_period_start: z.string().nullable().optional(),
          notification_period_end: z.string().nullable().optional(),
          slug: z.string().nullable().optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.documents.updateDocument(
        args.document_uid,
        args.body as Parameters<typeof client.documents.updateDocument>[1],
        options,
      ),
    }),
  );
}
