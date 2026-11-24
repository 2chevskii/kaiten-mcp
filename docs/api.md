# Migrating from v2

The current catalog has 14 tools. Replace the old tool name and operation with the corresponding canonical call, then check `request.args` and the response envelope against the schema returned by `tools/list`.

The [v3.0.0 reference](https://github.com/2chevskii/kaiten-mcp/blob/v3.0.0/docs/api.md) documents the prior calls. The [tool reference](./tools.md) lists the current domains.

| v2 call                                                                                       | Canonical call                                                                                                       |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `kaiten_navigation_read` with `get_current_user`, `list_spaces`, `list_boards` or `get_board` | Use the same operation in `kaiten_workspace_read`. Pass `limit` and `offset` at the top level of `args` when paging. |
| `spaceBoards.createNewBoard`                                                                  | `create_board` in `kaiten_workspace_write`, with `space_id` and `body`.                                              |
| `columns.getListOfColumns`                                                                    | `list_columns` in `kaiten_workspace_read`, with `board_id` and `format: "native"`.                                   |
| `kaiten_comments_read` or `kaiten_relations_read`                                             | Use `kaiten_collaboration_read`. For full comments, choose `list_comments` with `format: "full"` and server paging.  |
| `cardTimeLogs.getTimeLogs`                                                                    | `list_card_time_logs` in `kaiten_workflows_read`. Pass the returned `next_offset` as `offset`.                       |
| `iterations.updateIteration`                                                                  | `update_iteration` in `kaiten_workflows_write`. Keep `space_uid`, `id` and `body`.                                   |
| `automations.createAutomation` and `automations.updateAutomation`                             | `create_automation` and `update_automation` in `kaiten_workflows_write`. Keep their native bodies.                   |

See the [card and collaboration mappings](./cards-and-collaboration.md#migrating-v2-calls) and [document and attachment mappings](./content-catalog.md#migrating-v2-calls) for argument and envelope changes.

## Example calls

Create a board with `kaiten_workspace_write`.

```json
{
  "request": {
    "operation": "create_board",
    "args": {
      "space_id": 1,
      "body": {
        "title": "Delivery",
        "columns": [
          {
            "title": "Queue",
            "type": 1
          }
        ],
        "lanes": [
          {
            "title": "Default"
          }
        ]
      }
    }
  }
}
```

Read full column configuration with `kaiten_workspace_read`.

```json
{
  "request": {
    "operation": "list_columns",
    "args": {
      "board_id": 2,
      "format": "native"
    }
  }
}
```

Create a dependency with `kaiten_collaboration_write`.

```json
{
  "request": {
    "operation": "add_planned_relation",
    "args": {
      "card_id": 10,
      "body": {
        "target_card_id": 20,
        "type": "end-start"
      }
    }
  }
}
```

## Client coverage and limits

The server uses the public `@2chevskii/kaiten-client` **1.3.0** for REST, SCIM, addon OAuth and incoming webhook calls. Kaiten permissions and feature availability apply. The metadata, import and browser-addon declarations are types. The MCP server runs over stdio and supports embedded file downloads.
