# SCIM provisioning

SCIM operations use the public `KaitenScimClient` with the configured company
origin and `KAITEN_TOKEN`. Reads share `kaiten_navigation_read`; creates and
patches share `kaiten_navigation_write`. The server still exposes 18 tools.

Calls use the [advanced operation envelope](./api.md). Top-level argument names
are `snake_case`; nested SCIM payloads and responses preserve their native
casing: `userName`, `givenName`, `displayName`, `Operations`, `Resources`,
`totalResults`. Results are the complete client response inside `{result}`.
Access errors use the same sanitized HTTP status format as REST operations.

| Operation                 | Arguments                                         | Behavior                                                       |
| ------------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| `scim.users.addUser`      | `body`: `emails`, `userName?`, `name?`            | Create a user; `emails` follows the client's JSON-map contract |
| `scim.users.getUser`      | `user_id`                                         | Read a user with SCIM metadata                                 |
| `scim.users.getUsers`     | `start_index?`, `count?`, `filter?`               | Read one page, including `Resources` and pagination metadata   |
| `scim.users.updateUser`   | `user_id`, `operations`                           | Patch activation or name fields                                |
| `scim.users.iterate`      | `start_index?`, `count?`, `filter?`, `max_items?` | Collect a bounded snapshot through the client iterator         |
| `scim.groups.addGroup`    | `display_name`                                    | Create a group                                                 |
| `scim.groups.getGroup`    | `group_id` (string or numeric ID)                 | Read a group                                                   |
| `scim.groups.getGroups`   | `start_index?`, `count?`                          | Read a group page                                              |
| `scim.groups.updateGroup` | `group_id`, `operations`                          | Patch display name or membership                               |
| `scim.groups.iterate`     | `start_index?`, `count?`, `max_items?`            | Collect a bounded group snapshot                               |

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

Deactivate a user with `kaiten_navigation_write`:

```json
{
  "request": {
    "operation": "scim.users.updateUser",
    "args": {
      "user_id": 5,
      "operations": [{"op": "replace", "path": "active", "value": false}]
    }
  }
}
```
