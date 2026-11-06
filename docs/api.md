# Advanced client operations

Advanced operations expose the complete public contracts of the pinned
`@2chevskii/kaiten-client` **1.1.0**. Use these when you need fields beyond the
convenient operations in the [tool reference](./tools.md).

Select the exact `resource.method` name in `request.operation`. Top-level
arguments use the client's parameter names converted to `snake_case`. Nested
`body` and `query` fields retain their upstream spelling, including camelCase
where the Kaiten API uses it. The advertised tool schema lists every accepted
field, enum, required value and nullable value. Unknown fields are rejected,
including inside typed bodies. JSON maps accept arbitrary keys.

The result is `{result: ...}` in both `structuredContent` and JSON text. It
preserves the client's complete JSON response, including fields not included in
the convenient projections. List operations return the upstream list or page
unchanged; they do not apply local pagination or fetch subsequent pages.
Successful operations with no response body return `{result: null}`.

The same token permissions, timeout, cancellation and sanitized error handling
apply. Invalid arguments return an MCP tool error with validation details.
HTTP failures include `KAITEN_HTTP_ERROR` and the upstream status;
for example, 403 means insufficient access and 404 means an unavailable entity.

## Workspace management

Reads use `kaiten_navigation_read`; mutations use `kaiten_navigation_write`.
The server now exposes **16 tools**, with a hard maximum of 20.

| Resource      | Operations after `resource.`                                                            | Arguments                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `spaces`      | `createNewSpace`, `updateSpace`, `removeSpace`, `retrieveSpace`, `retrieveListOfSpaces` | `body` for create; `space_id` and `body` for update; `space_id` for get/delete; `limit?`, `offset?` for list  |
| `spaceBoards` | `createNewBoard`, `getBoard`, `getListOfBoards`, `updateBoard`, `removeBoard`           | `space_id`; `body` for create/update; `id` for get/update/delete; `force?` for delete                         |
| `boards`      | `getBoard`                                                                              | `board_id`                                                                                                    |
| `columns`     | `createNewColumn`, `getListOfColumns`, `updateColumn`, `removeColumn`                   | `board_id`; `body` for create/update; `column_id` for update/delete; `force?` for delete                      |
| `subcolumn`   | `createNewSubcolumn`, `getListOfSubcolumns`, `updateSubcolumn`, `removeSubcolumn`       | `column_id`; `body` for create/update; `subcolumn_id` for update/delete; `force?` for delete                  |
| `lanes`       | `createNewLane`, `getListOfLanes`, `updateLane`, `removeLane`                           | `board_id`; `body` for create/update; `lane_id` for update/delete; `condition?` for list; `force?` for delete |

Use create bodies for initial columns/lanes, external identifiers and board
behavior. Updates support all fields in the client, including WIP limits,
archive policies, SLA pausing, default tags, card-property configuration, space
access/settings and board movement between spaces. Update bodies require at
least one change. An omitted optional field is left unchanged; `null` clears
only fields declared nullable. Force deletion can remove containers with cards;
omit `force` to retain Kaiten's default safeguards.

Create a board with `kaiten_navigation_write`:

```json
{
  "request": {
    "operation": "spaceBoards.createNewBoard",
    "args": {
      "space_id": 1,
      "body": {
        "title": "Delivery",
        "columns": [{"title": "Queue", "type": 1}],
        "lanes": [{"title": "Default"}]
      }
    }
  }
}
```

Read full column configuration with `kaiten_navigation_read`:

```json
{"request": {"operation": "columns.getListOfColumns", "args": {"board_id": 2}}}
```
