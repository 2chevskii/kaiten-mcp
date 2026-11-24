# Tool reference

The catalog exposes 14 tools. Each domain has one
read tool and one write tool. Invoke them with `request.operation` and
its matching `request.args`.

| Domain                                                             | What it handles                                                                                           |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `kaiten_workspace_read` / `kaiten_workspace_write`                 | Spaces, boards, layout, users, roles, groups, SCIM, taxonomy and audit                                    |
| `kaiten_cards_read` / `kaiten_cards_write`                         | Search, details, lifecycle, batch changes and card history                                                |
| `kaiten_collaboration_read` / `kaiten_collaboration_write`         | Comments, native links, members, attached tags, children, blockers and planned relations                  |
| `kaiten_checklists_read` / `kaiten_checklists_write`               | Checklists, items and templates                                                                           |
| `kaiten_custom_properties_read` / `kaiten_custom_properties_write` | Field definitions, values, directories and card property assignment                                       |
| `kaiten_content_read` / `kaiten_content_write`                     | Documents, document groups, schemas and file attachments                                                  |
| `kaiten_workflows_read` / `kaiten_workflows_write`                 | Iterations, historical sprints, time logs, timesheets, automation, service desk, SLA and webhook delivery |

Use the tool schemas returned by `tools/list` for the exact arguments of each operation.

```json
{"request": {"operation": "get_card", "args": {"card_id": 123}}}
```

Send this request to `kaiten_cards_read`. See [workflows](./workflows.md), [cards and collaboration](./cards-and-collaboration.md), [documents and attachments](./content-catalog.md), or [migration from v2](./api.md).

## Result contracts

Successful calls return the envelope in `structuredContent` and the same JSON
in a text entry in `content`. These examples show the structured payload only:

```json
{"item": {"id": 5, "full_name": "Alex"}}
```

```json
{"items": [{"id": 1, "title": "Work"}], "next_offset": null}
```

```json
{
  "items": [{"id": 123, "title": "Release", "board_id": 2, "column_id": 3}],
  "next_cursor": null
}
```

Each operation validates its output against its own result schema. Each tool advertises the result envelopes its operations can return.
In compact projections, optional fields appear only when returned by
Kaiten and unknown upstream fields are stripped. Native reads and writes that use `{result}` preserve complete JSON. [File downloads](./files.md) also return an embedded
binary resource. A missing field differs from an explicit `null`.

Read tools advertise `readOnlyHint: true` and `idempotentHint: true`. Write tools advertise `destructiveHint: true` because they group creation, updates, and removals. All write tools advertise `readOnlyHint: false` and
`idempotentHint: false`. All tools use `openWorldHint: true`. These annotations
inform the MCP host; token permissions determine access in Kaiten.

## Cards

Read card fields with `get_card`, use `search_cards` to find cards and `create_card` or `update_card` with `args.body` to write fields. See [search and lifecycle](./cards-and-collaboration.md#search-and-lifecycle) for native modes and pagination.

## Existing custom properties

| Tool                                                              | Arguments                                     | Behavior                                               |
| ----------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `kaiten_custom_properties_read` (`list_custom_properties`)        | `query?`, `limit?`, `offset?`                 | Find definitions with type and settings                |
| `kaiten_custom_properties_read` (`get_custom_property`)           | `property_id`                                 | Get one definition                                     |
| `kaiten_custom_properties_read` (`list_select_values`)            | `property_id`, `query?`, `limit?`, `offset?`  | Find existing select option IDs and values             |
| `kaiten_custom_properties_read` (`list_catalog_values`)           | `property_id`, `query?`, `limit?`, `offset?`  | Find existing catalog value IDs and values             |
| `kaiten_custom_properties_read` (`list_custom_directories`)       | `query?`, `limit?`, `offset?`                 | Read directories with field definitions                |
| `kaiten_custom_properties_read` (`list_custom_directory_records`) | `directory_id`, `query?`, `limit?`, `offset?` | Read existing records with their values                |
| `kaiten_custom_properties_write` (`set_card_properties`)          | `card_id`, `properties`                       | Assign or clear a nonempty map of card property values |

Read the definition and relevant options first. Property keys use
`id_<positive property ID>`. Values use Kaiten's native JSON representation:

| Property                  | Value example                                                 |
| ------------------------- | ------------------------------------------------------------- |
| String, URL, email, phone | `"value"`                                                     |
| Number or rating          | `12`                                                          |
| Select or multiselect     | `[12]` or `[12, 13]` using option IDs                         |
| Catalog                   | `"3"` using a catalog value ID                                |
| Custom directory          | `["12345678-1234-4234-8234-123456789abc"]` using record UUIDs |
| Date                      | `{"date":"2026-10-15","time":"12:00:00","tzOffset":180}`      |
| Clear the value           | `null`                                                        |

The server validates keys and JSON values; Kaiten validates compatibility with
the property's type and permissions. Fields not included in `properties` are not
sent. Use the [field administration guide](./custom-fields.md) to manage definitions, options and records.

```json
{
  "card_id": 123,
  "properties": {
    "id_7": [12, 13],
    "id_8": null
  }
}
```
