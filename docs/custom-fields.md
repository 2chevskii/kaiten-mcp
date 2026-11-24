# Custom-field administration

Use `kaiten_custom_properties_read` to discover field definitions and allowed values, and `kaiten_custom_properties_write` to manage them or assign values to cards. Native list forms accept `format: "native"` and return the upstream response in `{result}`. See [directories](./directories.md) for directory fields and records.

| Area           | Operations                                                                                                                    | Arguments                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Definitions    | `create_custom_property`, `list_custom_properties`, `get_custom_property`, `update_custom_property`, `delete_custom_property` | `body` for create/update; `query?` for list; `property_id` for get/update/delete                                    |
| Select options | `create_select_value`, `list_select_values`, `get_select_value`, `update_select_value`, `delete_select_value`                 | `property_id`; `value`, `color?` for create; `query?` for list; `value_id` for get/update/delete; `body` for update |
| Catalog values | `create_catalog_value`, `list_catalog_values`, `get_catalog_value`, `update_catalog_value`, `delete_catalog_value`            | `property_id`; `body` for create/update; `query?` for list; `value_id` for get/update/delete                        |
| Scores         | `add_collective_score`, `list_collective_scores`, `update_collective_score`                                                   | `card_id`, `property_id`; string `value` for create; `value_id`, nullable string `value` for update                 |
| Votes          | `add_collective_vote`, `list_collective_votes`, `update_collective_vote`, `remove_collective_emoji_vote`                      | `card_id`, `property_id`; `body` for create; `id`, `number_vote?` for update; `id`, `emoji_vote` for remove         |
| Bindings       | `bind_custom_property`, `list_property_bindings`, `unbind_custom_property`                                                    | `property_id`; `tree_entity_uid` for add; `uid` for delete                                                          |

## Definitions and formulas

Creation requires either `name` and `type`, or `formula` and
`formula_source_card`. Types include string, number, URL, formula, date, email,
phone, checkbox, select, collective score, vote, collective vote, catalog, user
and attachment. The complete body supports facade display, multiline text,
voting variants, value types, colors, multiple selection, user-created values,
field settings and typed restrictions/formula/voting configuration under `data`.

Updates support name, facade/multiline flags, active/inactive condition,
color/multiple-selection/value-creation settings, JSON `data`, nullable field
settings and progress-field status. Only fields declared nullable can be cleared
with `null`; other omitted fields remain unchanged. The tool schema advertises
the complete accepted contract.

## Options, scores and votes

Select updates require at least one supplied change and accept value, color,
condition, order and deletion flag. Catalog bodies hold a JSON `value` map;
catalog updates require `condition` or `value`, optionally with `deleted`.
`delete_select_value` and `delete_catalog_value` remove one option. Use `delete_custom_property` to remove the field definition.

Scores are strings, including numeric-looking values; `value: null` clears a
score on update. Creating a collective vote requires `emoji_vote` or
`number_vote`. Numeric vote updates accept `null`; removing an emoji vote also
requires its `emoji_vote` string. Zero and empty value lists are preserved.
Tree bindings control field availability; successful binding deletion returns
`{result: null}`.

List queries expose all client filters, author/value flags and ordering. Select
`conditions` is an array of `active`, `inactive`, `removed`; catalog `conditions`
is a string. Lists use explicit `limit` (1–100) and `offset`, preserving the
upstream response without local slicing. Supply offset pages to retrieve lists
beyond the upstream 100-value page cap. Query ID arrays accept HTTP scalar values.

Create a select option with `kaiten_custom_properties_write`:

```json
{
  "request": {
    "operation": "create_select_value",
    "args": {"property_id": 7, "value": "Urgent", "color": null}
  }
}
```
