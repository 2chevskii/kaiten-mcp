# Card types and tags

Use the workspace tools for reusable card types and tags. The compact lists are `list_card_types` and `list_workspace_tags`. Set `format: "native"` for native filters and complete metadata. Use the collaboration tools for tags on one card.

| Area           | Operations                                                                                     | Arguments                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Card types     | `create_card_type`, `get_card_type`, `list_card_types`, `update_card_type`, `delete_card_type` | `body` for create/update; `id` for get/update/remove; `replace_type_id` for remove; `limit?`, `offset?` for list |
| Type bindings  | `bind_card_type`, `list_card_type_bindings`, `unbind_card_type`                                | `type_id`; `tree_entity_uid` for add; `uid` for delete                                                           |
| Workspace tags | `create_workspace_tag`, `list_workspace_tags`, `scan_workspace_tags`                           | `name`, `query?` for create; `query?` for list/iterate; `max_items?` for iterate                                 |

Card type creation requires `name`, `letter` and numeric `color`; it also
accepts `properties`, `card_properties` and `suggest_fields`. The client's
update contract requires at least one of `name`, `letter`, `color`, `properties`,
and also permits typed `card_properties` and `suggest_fields`. Property
configurations describe a regular property or property UID, ordering, required
status and type UID. Prefer `card_properties`; upstream deprecates `properties`.
Removing a type requires an explicit replacement type. Tree-entity bindings
control where the type is available; successful deletion returns `{result: null}`.

Tag list queries accept `ids` as an array or comma-separated string, `space_id`,
`query`, `limit` and `offset`. Tag creation also accepts the client's optional
query contract. `scan_workspace_tags` preserves filters and uses offset pagination;
it returns `{result: {items, truncated}}`, with `max_items` defaulting to 100
(1–1,000), a possible lookahead item and no continuation token. Use
`list_workspace_tags` for explicit pages. Existing card-tag operations
continue to attach and detach tags from cards.

Create a type through canonical `kaiten_workspace_write`.

```json
{
  "request": {
    "operation": "create_card_type",
    "args": {
      "body": {
        "name": "Task",
        "letter": "T",
        "color": 1,
        "suggest_fields": false
      }
    }
  }
}
```
