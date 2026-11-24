# Documents, groups and schemas

Read documents, groups and schemas in `kaiten_content_read`. Make changes in `kaiten_content_write`. The native response is in `{result}`. See [documents and attachments](./content-catalog.md) for schema upgrades and archive behavior.

| Area            | Operations                                                                                                                                       | Arguments                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Documents       | `create_document`, `get_document`, `list_documents`, `update_document`, `archive_document`, `scan_documents`                                     | `body` for create/update; `document_uid` for get/update/delete; `query?` for list/iterate; `max_items?` for iterate       |
| Document groups | `create_document_group`, `get_document_group`, `list_document_groups`, `update_document_group`, `archive_document_group`, `scan_document_groups` | `body` for create/update; `document_group_uid` for get/update/delete; `query?` for list/iterate; `max_items?` for iterate |
| Schemas         | `get_document_schema`                                                                                                                            | `schema_version` string, optional `format`: `draft-06` or `prosemirror`                                                   |

## Content and editing

Document creation requires numeric `sort_order`; title, parent, access-role,
clone UID/version and key are optional. Create or clone a document, then update
its content with `update_document`. Updates expose the full contract:
content, title/order, parent/access, publication date/version, backup version,
public-site flags, redirect, content width, key/slug, icons and notification
periods. `published_version` accepts a number, `null` or `"current"`. Update
bodies require at least one change; omitted fields remain omitted and explicit
nulls are preserved where supported.

`data` is a ProseMirror document tree: root `type: "doc"` with a `content` array.
Nodes require a nonempty `type`; they may have JSON `attrs`, nested `content`,
`marks` and `text`. Marks require a type and may have JSON attributes. Text nodes
require nonempty text. Unknown structural fields and malformed nested nodes are
rejected before HTTP. Node/mark names and attribute semantics depend on the
document's Kaiten schema version; retrieve that version's schema to discover
them. The backend validates version-specific content. Both schema formats and
their extension fields are preserved in responses.

Group creation supports title, parent, role, order and key. Group updates also
expose access, hostname/redirect, icon, public-site visibility, news feed and
index-document configuration, enforcing the client's required change fields.
Document and group deletion use their public DELETE endpoints.

## Pagination

List queries expose the complete client filters, text projections, role or
preview flags and pagination fields. Version 1/default results are arrays;
version 2 returns `{result: [...], position: "..."}` inside the outer result
envelope. Preserve filters and pass `position` as `query.start_position` for
the next page; an empty position ends the search. IDs and metadata retain the
upstream version's types without conversion.

`scan_documents` and `scan_document_groups` use the client's v2 cursor traversal. They return
`{result: {items, truncated}}`, bounded by `max_items` (default 100, range
1–1,000), with one possible lookahead item and no continuation token. Use raw
list operations for resumable pages. Cancellation and timeout cover the whole
iteration.

Write content through `kaiten_content_write`:

```json
{
  "request": {
    "operation": "update_document",
    "args": {
      "document_uid": "document-uid",
      "body": {
        "data": {
          "type": "doc",
          "content": [
            {
              "type": "paragraph",
              "content": [{"type": "text", "text": "Specification"}]
            }
          ]
        }
      }
    }
  }
}
```
