# Custom-field administration

See also [custom directories](./directories.md) for directory, field and record management.

These [advanced operations](./api.md) share `kaiten_custom_properties_read` and
`kaiten_custom_properties_write`; the server still exposes 18 tools. Results
preserve the complete client response in `{result}`. Existing convenient reads
and `set_card_properties` remain available.

| Resource                              | Operations after `resource.`                                                                                 | Arguments                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `customProperties`                    | `createNewProperty`, `getListOfProperties`, `getProperty`, `updateProperty`, `removeProperty`                | `body` for create/update; `query?` for list; `property_id` for get/update/delete                                    |
| `customPropertySelectValues`          | `createNewSelectValue`, `getListOfSelectValues`, `getSelectValue`, `updateSelectValue`, `removeProperty`     | `property_id`; `value`, `color?` for create; `query?` for list; `value_id` for get/update/delete; `body` for update |
| `customPropertyCatalogValues`         | `createNewCatalogValue`, `getListOfCatalogValues`, `getCatalogValue`, `updateCatalogValue`, `removeProperty` | `property_id`; `body` for create/update; `query?` for list; `value_id` for get/update/delete                        |
| `customPropertyCollectiveScoreValues` | `createNewScoreValue`, `getListOfScoreValues`, `updateScoreValue`                                            | `card_id`, `property_id`; string `value` for create; `value_id`, nullable string `value` for update                 |
| `customPropertyCollectiveVoteValues`  | `createNewVoteValue`, `getListOfVoteValues`, `updateVoteValue`, `removeVoteValue`                            | `card_id`, `property_id`; `body` for create; `id`, `number_vote?` for update; `id`, `emoji_vote` for remove         |
| `customPropertyTreeEntities`          | `addTreeEntityToCustomProperty`, `getListOfCustomPropertyTreeEntities`, `deleteTreeEntityFromCustomProperty` | `property_id`; `tree_entity_uid` for add; `uid` for delete                                                          |

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
The methods named `removeProperty` on the select/catalog resources remove the
specified **value**, whereas `customProperties.removeProperty` removes the field.

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
    "operation": "customPropertySelectValues.createNewSelectValue",
    "args": {"property_id": 7, "value": "Urgent", "color": null}
  }
}
```
