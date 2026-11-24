# SCIM provisioning

Use `kaiten_workspace_read` for SCIM lookups, pages and snapshots, and `kaiten_workspace_write` to provision and patch. Top-level arguments use `snake_case`; nested SCIM payloads retain `userName`, `givenName`, `displayName` and other native names. Read the complete API response from `{result}`.

| Operation              | Arguments                                         | Behavior                                                       |
| ---------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| `provision_scim_user`  | `body`: `emails`, `userName?`, `name?`            | Create a user; `emails` follows the client's JSON-map contract |
| `get_scim_user`        | `user_id`                                         | Read a user with SCIM metadata                                 |
| `list_scim_users`      | `start_index?`, `count?`, `filter?`               | Read one page, including `Resources` and pagination metadata   |
| `update_scim_user`     | `user_id`, `operations`                           | Patch activation or name fields                                |
| `scan_scim_users`      | `start_index?`, `count?`, `filter?`, `max_items?` | Collect a bounded snapshot through the client iterator         |
| `provision_scim_group` | `display_name`                                    | Create a group                                                 |
| `get_scim_group`       | `group_id` (string or numeric ID)                 | Read a group                                                   |
| `list_scim_groups`     | `start_index?`, `count?`                          | Read a group page                                              |
| `update_scim_group`    | `group_id`, `operations`                          | Patch display name or membership                               |
| `scan_scim_groups`     | `start_index?`, `count?`, `max_items?`            | Collect a bounded group snapshot                               |

`start_index` is a positive safe integer and maps to SCIM's one-based
`startIndex`; `count` is a nonnegative safe integer. Client iterators default to
index 1 and advance by the number of resources actually returned, preserving
`count` and the user filter. They stop at `totalResults` or an empty page and
ignore the response's `startIndex` when advancing. Their result is
`{result: {items, truncated}}`, limited to 100 items by default (1–1,000).
One lookahead item may be read to determine truncation. The snapshot has no
continuation token; use single-page operations for explicit pagination.

User patches accept `replace active` with a boolean; `add`/`replace name` with
partial `{givenName, familyName}`; `add`/`replace name.givenName` or
`name.familyName` with a string; and `remove` for those name paths without a
value. Group patches accept `add`/`remove members` with a numeric user ID, and
`add`/`replace displayName` with a string. The client constructs the capitalized
`Operations` wrapper. Group provisioning is marked beta upstream.

Deactivate a user through canonical `kaiten_workspace_write`.

```json
{
  "request": {
    "operation": "update_scim_user",
    "args": {
      "user_id": 5,
      "operations": [{"op": "replace", "path": "active", "value": false}]
    }
  }
}
```
