# Documents and attachments

Use `kaiten_content_read` to search for documents, read their content or schema,
and inspect or download attachments. Use `kaiten_content_write` to change
documents or attach, rename and delete files. Pass the operation and its input
as `request.operation` and `request.args`.

## Documents

- Call `list_documents` or `list_document_groups` to get a page. Version 1 uses
  an offset, starts at 0 and returns an array. Choose version 2 for OpenSearch
  and repeat the same filters with the previous `position` as
  `query.start_position`. An empty position ends the search. Document search
  previews use `query.include_search_preview` with version 2.
- Use `scan_documents` or `scan_document_groups` for a bounded snapshot. The
  snapshot defaults to 100 items and is capped at 1,000. When `truncated` is
  true, continue with the corresponding paged list.
- Read the selected `uid` with `get_document` or `get_document_group`.
  Create a document with its sort order and optional parent UID. To edit the
  contents, read the current version with `get_document_schema` and submit the
  full ProseMirror tree as `body.data` to `update_document`.
- Document and group archive operations use the corresponding Kaiten DELETE
  routes. They return an archived record. This catalog has no restore
  operation. Inspect a folder’s contents before archiving it.
- Changing document access or publishing metadata can change who can see the
  content. Confirm the destination group and intended audience before updating
  its parent or access settings.

See the [document edit contract](https://developers.kaiten.ru/documents/update-document)
and [document removal](https://developers.kaiten.ru/documents/remove-document)
and [group removal](https://developers.kaiten.ru/document-groups/remove-document-group)
references.

## Attachments

Call `list_card_files` with the numeric card ID to find the card UUID and its
attachment IDs. Comment and property attachment IDs come from the corresponding
parent records. Select the matching `target` on other attachment operations.

| Target        | Arguments                                                              |
| ------------- | ---------------------------------------------------------------------- |
| `card`        | `card_uid`, and `file_uid` for an existing attachment.                 |
| `comment`     | `card_uid`, `comment_uid`, and `file_uid` for an existing attachment.  |
| `property`    | `card_uid`, `property_uid`, and `file_uid` for an existing attachment. |
| `legacy_card` | Numeric `card_id` and, for an existing attachment, numeric `file_id`.  |

1. Use `get_attachment` for metadata. On restricted targets, set
   `query.redirect: true` for a temporary signed location. Set
   `query.download: true` to request attachment disposition. Both options
   leave the actual bytes unfetched. Keep temporary locations private.
2. Use `download_attachment` for an embedded binary resource. The MCP server
   fetches storage without Kaiten credentials and enforces the decoded byte
   limit defined by `KAITEN_MAX_FILE_BYTES`. A metadata call may succeed for an
   attachment whose bytes exceed that limit.
3. Use `attach_file` to send canonical padded base64. Prefer restricted UUID
   routes. Legacy uploads are deprecated and can be disabled by the company.
   After an ambiguous timeout, check the target before retrying to avoid a
   duplicate.
4. Use `update_attachment` with a `body` containing a new name, a cover flag or
   both. Legacy attachments support only the cover flag. Explicit `false`
   clears the cover flag; an omitted value leaves it unchanged. Use
   `delete_attachment` to remove a file from its parent.

Restricted files inherit parent authorization. See the
[Kaiten restricted file migration guide](https://developers.kaiten.ru/restricted-access-files-migration).

## Migrating v2 calls

Set `KAITEN_TOOL_PROFILE=legacy` for the existing
[document](./documents.md) and [file](./files.md) contracts.

| v2 operations                                                                                                   | Canonical call                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `documents.retrieveListOfDocuments`, `documents.iterate`, `documents.retrieveDocument`                          | `list_documents`, `scan_documents`, `get_document`, respectively. Keep the existing arguments.                                                                            |
| `documentGroups.retrieveListOfDocumentGroups`, `documentGroups.iterate`, `documentGroups.retrieveDocumentGroup` | `list_document_groups`, `scan_document_groups`, `get_document_group`, respectively.                                                                                       |
| `documentSchemas.getDocumentDataSchema`                                                                         | `get_document_schema`.                                                                                                                                                    |
| v2 create, update and remove for documents and groups                                                           | `create_document`, `update_document`, `archive_document` and the matching group operations.                                                                               |
| `list_card_files`                                                                                               | `list_card_files`. Keep the arguments and local paging response.                                                                                                          |
| v2 attachment gets                                                                                              | `get_attachment` with the matching target. Move direct-card `redirect` and `download` into `args.query`.                                                                  |
| v2 attachment downloads                                                                                         | `download_attachment` with the matching target.                                                                                                                           |
| v2 attachment uploads                                                                                           | `attach_file` with the matching target.                                                                                                                                   |
| v2 attachment updates                                                                                           | `update_attachment` with the matching target. Move top-level `name` and `card_cover` into `args.body`, and include at least one change. Empty patches remain legacy-only. |
| v2 attachment removal or detachment                                                                             | `delete_attachment` with the matching target.                                                                                                                             |
