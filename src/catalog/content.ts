import * as z from 'zod/v4';
import type {CatalogDefinition} from '../catalog.ts';
import {attachmentReads, attachmentWrites} from './attachments.ts';

const documentUid = {
  document_uid:
    'Document UID from list_documents. Use uid rather than the numeric id field.',
};
const documentGroupUid = {
  document_group_uid:
    'Document group UID from list_document_groups. Use uid rather than the numeric id field.',
};
const documentEntity = z.looseObject({
  uid: z
    .string()
    .describe(
      'Stable UID for subsequent document or document-group operations.',
    ),
});
const entityOutput = z.object({result: documentEntity});
const listOutput = z.object({
  result: z
    .union([
      z.array(documentEntity),
      z.looseObject({
        result: z
          .array(documentEntity)
          .describe('Records in this version 2 search page.'),
        position: z
          .string()
          .describe(
            'Opaque position for the next identical query; empty at the end.',
          ),
      }),
    ])
    .describe('Default version 1 array or version 2 cursor page.'),
});
const scanOutput = z.object({
  result: z.object({
    items: z
      .array(documentEntity)
      .describe('Snapshot collected across version 2 pages.'),
    truncated: z
      .boolean()
      .describe('True when additional matches remain after max_items.'),
  }),
});
const sharedQuery = {
  query:
    'Kaiten search text, lifecycle filter and paging options for the selected resource.',
  'query.query': 'Text to search for among entities visible to the token user.',
  'query.condition': 'Kaiten condition code for filtering version 2 results.',
  'query.limit':
    'Maximum records requested per API page. The default and maximum for version 1 are 100; this tool caps either version at 100.',
  'query.start_position':
    'Kaiten version 2 cursor. Reuse position from the prior page with unchanged filters, or omit to start from the beginning.',
};
const listQuery = {
  'query.version':
    'Omit or use 1 for the default offset-based array. Use 2 for OpenSearch with a result array and a position cursor.',
  'query.offset': 'Number of records to skip for offset paging. Default 0.',
};
const scanLimit = {
  max_items:
    'Total records allowed in the snapshot across API pages. Default 100, maximum 1000; snapshots return no continuation.',
};
const documentQuery = {
  ...sharedQuery,
  'query.fields':
    'Comma-separated Kaiten fields the version 2 text search should match.',
  'query.include_search_preview':
    'When true, include the search preview object in each version 2 match. Default false.',
};
const groupQuery = {
  ...sharedQuery,
  'query.role': 'Minimum role of the token user: 1 reader, 2 writer, 3 admin.',
};
const commonBody = {
  'body.title': 'Display title for this document or document group.',
  'body.sort_order':
    'Numeric position relative to other items in the parent group.',
  'body.parent_entity_uid':
    'UID of the destination group. Null selects the root.',
  'body.for_everyone_access_role_id':
    'Role UID that applies when access is for_everyone.',
  'body.key':
    'Optional Kaiten key for this entity. Null clears the key where supported.',
};
const accessBody = {
  'body.access':
    'Use for_everyone for role-based general Kaiten access, or by_invite for explicitly invited users.',
  'body.redirect_url':
    'Public-site redirect destination. Null clears the redirect.',
  'body.hidden_on_public_site':
    'Hide this record from the public site when true.',
  'body.icon_type':
    'Choice of icon representation. Null removes the configured type.',
  'body.icon_value':
    'Identifier or value of the selected icon. Null clears it.',
  'body.icon_color': 'Kaiten icon color code. Null clears it.',
};

const documentUpdateFields = {
  ...documentUid,
  body: 'Document patch. Omitted fields retain their values; explicit null only clears nullable fields.',
  ...commonBody,
  ...accessBody,
  'body.publish_date':
    'Publication timestamp. Null clears the configured date.',
  'body.data':
    'Replacement ProseMirror document tree with root type doc and a content array. Submit the full tree for the selected schema.',
  'body.data.type': 'Root node type, doc.',
  'body.data.content':
    'Ordered top-level nodes, which can nest content and contain schema-defined marks and attributes.',
  'body.data.attrs':
    'Root node attributes defined by Kaiten’s document schema.',
  'body.data.marks':
    'Optional marks defined by the selected Kaiten document schema.',
  'body.data.text': 'Root text field where supported by the document schema.',
  'body.public': 'Set public-site publication visibility.',
  'body.settings': 'Document display settings.',
  'body.settings.content_width':
    'Default or wide layout. Wide requires the corresponding Kaiten rollout.',
  'body.published_version':
    'Pass a revision number to pin it, current to publish the latest saved revision, or null to leave the published revision unpinned.',
  'body.notification_period_start':
    'Start timestamp of the notification window. Null clears it.',
  'body.notification_period_end':
    'End timestamp of the notification window. Null clears it.',
  'body.slug': 'Public URL slug. Null clears the custom slug.',
};

export const contentCatalog: CatalogDefinition = {
  content_read: {
    description: [
      'Find Kaiten documents and folders, read content and schemas, and inspect or download attachments.',
      'For cursor paging use query.version=2 and reuse position as query.start_position. Use query.include_search_preview=true on list_documents for excerpts, or scan operations with max_items for bounded snapshots.',
      'Resolve IDs with list_card_files or parent metadata. For a direct restricted attachment, use target=card with card_uid and file_uid. Numeric card_id and file_id select target=legacy_card.',
      'For restricted files, get_attachment with query.redirect=true returns a signed link. Omit redirect for metadata. query.download controls disposition. Use download_attachment for bytes.',
      'Downloads exceeding KAITEN_MAX_FILE_BYTES return FILE_TOO_LARGE. Metadata reads are exempt. Storage fetches omit Kaiten credentials.',
    ].join(' '),
    operations: {
      list_documents: {
        source: 'documents.retrieveListOfDocuments',
        description:
          'Search or list one page of visible documents. For searches with previews, choose version 2 and include_search_preview. Use get_document to fetch full content by UID.',
        fields: {...documentQuery, ...listQuery},
        output: listOutput,
      },
      scan_documents: {
        source: 'documents.iterate',
        description:
          'Collect a bounded snapshot across version 2 document pages without maintaining a cursor. Choose list_documents to resume later.',
        fields: {...documentQuery, ...scanLimit},
        output: scanOutput,
      },
      get_document: {
        source: 'documents.retrieveDocument',
        description:
          'Fetch a selected document’s body, schema version, access record and publishing metadata when returned by Kaiten.',
        fields: documentUid,
        output: entityOutput,
      },
      list_document_groups: {
        source: 'documentGroups.retrieveListOfDocumentGroups',
        description:
          'Search or list one page of visible document groups, optionally filtering by minimum role. Use this to discover destination group UIDs.',
        fields: {...groupQuery, ...listQuery},
        output: listOutput,
      },
      scan_document_groups: {
        source: 'documentGroups.iterate',
        description:
          'Collect a bounded snapshot across version 2 document-group pages. Choose list_document_groups for a continuation.',
        fields: {...groupQuery, ...scanLimit},
        output: scanOutput,
      },
      get_document_group: {
        source: 'documentGroups.retrieveDocumentGroup',
        description:
          'Inspect a specific group’s parent, homepage, settings and direct child references when returned.',
        fields: documentGroupUid,
        output: entityOutput,
      },
      get_document_schema: {
        source: 'documentSchemas.getDocumentDataSchema',
        description:
          'Read the ProseMirror node and mark contract before editing the full document body. Request the document’s schema version for an existing document.',
        fields: {
          schema_version:
            'Use v<number> (for example v25) for an exact schema, or latest to resolve the current schema.',
          format:
            'Use draft-06 (default) for JSON Schema or prosemirror for node and mark specifications.',
        },
      },
      ...attachmentReads,
    },
  },
  content_write: {
    description: [
      'Create, edit, move, publish or archive Kaiten documents and folders. Attach, rename, set covers or delete files. Use kaiten_cards_write for card fields and placement.',
      'Resolve document and attachment IDs with kaiten_content_read. Use card_uid for restricted targets and include comment_uid or property_uid for that parent. Edit or delete by file_uid. Use target=legacy_card with numeric IDs for existing legacy files or explicitly enabled deprecated uploads. Upload padded base64 in file.data_base64.',
      'For a schema change, send a concrete body.schema_version such as v28 with the entire ProseMirror body.data and omit backup_version.',
      'Kaiten checks entity and parent permissions. Restricted files inherit parent access. Deleted attachments have no restore. Read back after timeouts before retrying.',
    ].join(' '),
    operations: {
      create_document: {
        source: 'documents.createNewDocument',
        description:
          'Create a new document at the given sort position. Supply a group UID for a nested document or clone_uid to copy an accessible document. Use update_document to set content.',
        fields: {
          body: 'New document placement and metadata, with optional source document for cloning.',
          ...commonBody,
          'body.clone_uid': 'UID of the existing document to copy.',
          'body.clone_version':
            'Numeric source document revision to copy when using clone_uid.',
        },
        output: entityOutput,
      },
      update_document: [
        {
          source: 'documents.updateDocument',
          description:
            'Patch metadata, restore a backup, or edit content using the document’s current schema. Fetch get_document_schema before submitting the complete ProseMirror tree. Review audience and revision before publishing.',
          fields: {
            ...documentUpdateFields,
            'body.backup_version': 'Version of the document backup to restore.',
          },
          output: entityOutput,
        },
        {
          source: 'documents.updateDocumentWithSchema',
          description:
            'Save a complete ProseMirror tree with its schema. Resolve the current or a newer schema using get_document_schema, then pass result.version as body.schema_version. Kaiten validates the tree as supplied and saves schema and content together.',
          fields: {
            ...documentUpdateFields,
            body: 'Document patch with a concrete schema_version and complete data. This form excludes backup_version.',
            'body.schema_version':
              'Use result.version from get_document_schema, for example v28. If you queried latest, use the returned concrete version. Include the full body.data tree and omit body.backup_version.',
          },
          output: entityOutput,
        },
      ],
      archive_document: {
        source: 'documents.removeDocument',
        description:
          'Remove a document through Kaiten’s archive endpoint. It returns the archived document; this catalog has no restore operation.',
        fields: documentUid,
        output: entityOutput,
      },
      create_document_group: {
        source: 'documentGroups.createNewDocumentGroup',
        description:
          'Create a titled folder at the root or under an existing parent group. Verify that the token can create in that destination.',
        fields: {
          body: 'New document folder title, parent, role and ordering.',
          ...commonBody,
        },
        output: entityOutput,
      },
      update_document_group: {
        source: 'documentGroups.updateDocumentGroup',
        description:
          'Change an existing folder’s title, parent, order or access/public-site settings. If setting a homepage, choose a visible document inside this group’s tree.',
        fields: {
          ...documentGroupUid,
          body: 'Folder patch. Include at least one of title, parent, sort order, access, hostname, key, icon type, public-site visibility, news feed or index document.',
          ...commonBody,
          ...accessBody,
          'body.hostname':
            'Hostname for this group’s public site. Null clears it.',
          'body.news_feed': 'Enable the public-site news feed for this group.',
          'body.index_document_uid':
            'Homepage document UID. Requires a configured hostname and a visible, unarchived document within this folder tree. Null clears it.',
        },
        output: entityOutput,
      },
      archive_document_group: {
        source: 'documentGroups.removeDocumentGroup',
        description:
          'Remove a selected group through Kaiten; it returns the group with archived true. Inspect its child groups and documents first. This catalog exposes no restore operation.',
        fields: documentGroupUid,
        output: entityOutput,
      },
      ...attachmentWrites,
    },
  },
};
