# Card types and tags

These [advanced operations](./api.md) use `kaiten_navigation_read` and
`kaiten_navigation_write`; the total remains 20 tools. They return the full
client response in `{result}`.

| Resource               | Operations after `resource.`                                                                 | Arguments                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `cardTypes`            | `createNewCardType`, `getCardType`, `getListOfCardTypes`, `updateCardType`, `removeCardType` | `body` for create/update; `id` for get/update/remove; `replace_type_id` for remove; `limit?`, `offset?` for list |
| `cardTypeTreeEntities` | `addTreeEntityToCardType`, `getListOfTypeTreeEntities`, `deleteTreeEntityFromCardType`       | `type_id`; `tree_entity_uid` for add; `uid` for delete                                                           |
| `tags`                 | `addTag`, `retrieveListOfTags`, `iterate`                                                    | `name`, `query?` for create; `query?` for list/iterate; `max_items?` for iterate                                 |

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
query contract. `tags.iterate` preserves filters and uses offset pagination;
it returns `{result: {items, truncated}}`, with `max_items` defaulting to 100
(1–1,000), a possible lookahead item and no continuation token. Use
`tags.retrieveListOfTags` for explicit pages. Existing card-tag operations
continue to attach and detach tags from cards.

Create a type through `kaiten_navigation_write`:

```json
{
  "request": {
    "operation": "cardTypes.createNewCardType",
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
