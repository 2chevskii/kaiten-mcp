# Custom directories

These [advanced operations](./api.md) share `kaiten_custom_properties_read` and
`kaiten_custom_properties_write`; the total remains 18 tools. Directory, field
and record IDs are UUIDs. All results preserve the complete upstream JSON in
`{result}`. The directory API is marked beta upstream.

| Resource                 | Operations after `resource.`                                                                                                  | Arguments                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `customDirectories`      | `createCustomDirectory`, `getListOfCustomDirectories`, `getCustomDirectory`, `updateCustomDirectory`, `deleteCustomDirectory` | `body` for create/update; `query?` for list; `directory_id` for get/update/delete                                                                                |
| `customDirectoryFields`  | `createField`, `getListOfFields`, `getField`, `updateField`, `deleteField`                                                    | `directory_id`; `body` for create/update; `field_id` for get/update/delete; `include_author?`, `conditions?` for list                                            |
| `customDirectoryRecords` | `createRecord`, `getListOfRecords`, `getRecord`, `updateRecord`, `deleteRecord`, `getCardsLinkedToRecord`                     | `directory_id`; `body` for create/update; `record_id` for get/update/delete/linked cards; `query?` for lists; `response_profile?` for writes; `profile?` for get |

Directory creation supports description, multiple selection, editing rights,
display-field index and initial fields. Fields support string, number, date,
email, URL, phone, checkbox, select, user, catalog, directory link and file types.
The directory-level field list also accepts custom-property and linked-directory
bindings. Standalone field creation accepts name/type, order, required and
display status; its update accepts name, condition, order and flags.

**Updating a directory's `fields` replaces the complete list. Omitted fields are
soft-deleted.** Include every field to retain. Optional `expected_field_ids`
must accompany that complete list and checks for a changed field list (HTTP 409);
it is not a general directory version check. The MCP accepts this documented
upstream guard even though the pinned client omits it from its TypeScript body
interface; the public client forwards it unchanged. Changes to a populated
field's type or binding may be rejected by Kaiten with HTTP 400.

Record write bodies use a `values` map keyed by field UUID, with JSON values.
Returned values are an array in the upstream response. Omitted keys retain
their values on update; `null` can clear a value according to the field type.
Record editing requires custom-property management rights or directory
`allow_editing: true`. Deleting a field or record marks it removed; deleting a
record also removes reverse directory links. Linked-card reads respect the
configured token's card access.

Lists expose author/value/field/count flags, conditions, search and explicit
offset pagination where supported. Field lists have no limit/offset parameters.
Directory/record lists use creation-time ordering without a unique tie-breaker;
offset pages cannot guarantee a duplicate-free export during concurrent changes.

## Record filters

`query.filters` accepts an array or an index-keyed object. Each filter has
`fieldId`, `fieldType`, `comparison`, optional `value` and
`searchByDisplayValue`. The MCP validates supported field/comparison combinations
and converts them to `filters[0][fieldId]`-style query parameters through the
public client method. This avoids the client's JSON encoding, which the
documented endpoint does not parse.

Text fields support `eq`, `ne`, `contains`, `not_contains`, `starts_with`,
`ends_with`, `known`, `unknown`; number/date support `eq`, `ne`, `gt`, `lt`,
`known`, `unknown`; checkbox supports `true`, `false`; file supports `known`,
`unknown`. Reference fields support `eq`, `ne`, `known`, `unknown`; select, user
and catalog also allow `contains` when `searchByDisplayValue: true`. Value-based
comparisons require a non-null `value`. Conditions use arrays of `active`,
`inactive`, `removed`. Preserve `filter_operator` and other filters on each page.

Search records via `kaiten_custom_properties_read`:

```json
{
  "request": {
    "operation": "customDirectoryRecords.getListOfRecords",
    "args": {
      "directory_id": "12345678-1234-4234-8234-123456789abc",
      "query": {
        "filters": [
          {
            "fieldId": "22345678-1234-4234-8234-123456789abc",
            "fieldType": "string",
            "comparison": "contains",
            "value": "Alice"
          }
        ],
        "limit": 25,
        "offset": 0
      }
    }
  }
}
```
