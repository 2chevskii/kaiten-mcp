# Tool reference

The server exposes 44 tools. Use [workflows](./workflows.md) for step-by-step
examples and [troubleshooting](./troubleshooting.md) for operational failures.

All names below have the `kaiten_` prefix. Arguments use `snake_case`.
Numeric IDs are positive safe integers; directory IDs are UUID strings.
`?` marks an optional argument. Unknown arguments are rejected.

`page` means optional `limit` (1–100, default 25) and `offset` (default 0).
Offset list results have `{items, next_offset}`. Search uses `{items, next_cursor}`.
Single-entity results have `{item}`. Each result also has equivalent JSON text.

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

The exact fields for each tool are advertised in its MCP `outputSchema`.
Optional fields appear only when returned by Kaiten; unknown upstream fields
are stripped. A missing field differs from an explicit `null`.

Read tools advertise `readOnlyHint: true` and `idempotentHint: true`. Creation
tools advertise `destructiveHint: false`; update and removal tools advertise
`destructiveHint: true`. All write tools advertise `readOnlyHint: false` and
`idempotentHint: false`. All tools use `openWorldHint: true`. These annotations
inform the MCP host; token permissions determine access in Kaiten.

## Navigation and lookup

| Tool                      | Arguments                     | Result                                                        |
| ------------------------- | ----------------------------- | ------------------------------------------------------------- |
| `kaiten_list_spaces`      | `page`                        | Space IDs and titles                                          |
| `kaiten_get_space`        | `space_id`                    | Space details and board references when returned by Kaiten    |
| `kaiten_list_boards`      | `space_id`, `page`            | Board IDs and titles; local pagination                        |
| `kaiten_get_board`        | `board_id`                    | Description, columns, lanes and custom property configuration |
| `kaiten_list_columns`     | `board_id`, `page`            | Columns with IDs, titles, order and type; local pagination    |
| `kaiten_list_lanes`       | `board_id`, `page`            | Lanes with IDs, titles and order; local pagination            |
| `kaiten_get_current_user` | None                          | Current user's ID, name and available identity fields         |
| `kaiten_list_users`       | `query?`, `page`              | Company users with IDs, names and email                       |
| `kaiten_list_card_types`  | `page`                        | Existing type IDs and names                                   |
| `kaiten_list_tags`        | `query?`, `space_id?`, `page` | Existing tag IDs, names and colors                            |

Local pagination fetches one complete upstream list and slices the requested page.
It does not cache results or follow additional upstream pages.

Column `column_id` identifies the parent column and can be `null` when there is
no parent. This applies to board details, column lists and card location details.

## Cards

| Tool                  | Arguments                                                                     | Behavior                                          |
| --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| `kaiten_search_cards` | Filters below, `limit?`, `cursor?`                                            | Version 1 search with a server continuation token |
| `kaiten_get_card`     | `card_id`                                                                     | Detailed card projection                          |
| `kaiten_create_card`  | `title`, `board_id`, editable fields, `column_id?`, `lane_id?`, `properties?` | Create a card                                     |
| `kaiten_update_card`  | `card_id`, `changes`                                                          | Change supplied editable fields                   |
| `kaiten_move_card`    | `card_id`, `board_id`, `column_id`, `lane_id`                                 | Move to an explicit location                      |
| `kaiten_archive_card` | `card_id`                                                                     | Set condition to archived (`2`)                   |
| `kaiten_restore_card` | `card_id`                                                                     | Set condition to live (`1`)                       |
| `kaiten_delete_card`  | `card_id`                                                                     | Delete through Kaiten's DELETE endpoint           |

Editable fields: `title`, `description`, `due_date`, `due_date_time_present`,
`asap`, `size_text`, `owner_id`, `type_id`. `changes` must contain at least one
field. Omitted fields remain unchanged. `null` clears `description`, `due_date`,
or `size_text`. Description text uses Kaiten's default Markdown format.

Dates accept `YYYY-MM-DD` or ISO timestamps with an explicit timezone. Boolean
flags accept booleans; IDs accept numbers. A title must be a nonempty string.

Search filters: `query`, `space_id`, `board_id`, `column_id`, `lane_id`,
`owner_ids`, `member_ids`, `responsible_ids`, `tag_ids`, `type_ids`, `states`,
`archived`, `asap`, `overdue`, `due_date_after`, `due_date_before`.
Plural ID filters are arrays. `states` accepts `1` (queued), `2` (in progress),
`3` (done). Omitted filters retain Kaiten's defaults.

Use `archived: false` to search only live cards, or `archived: true` for archived
cards. Search uses Kaiten's version 1 endpoint, ordered by card ID, and paginates
with `offset`. The server returns that position as `next_cursor`; pass it as
`cursor` with the same filters to continue. A full page may require one final
empty request before `next_cursor` becomes `null`. Offset pages can shift if
matching cards are added, removed or changed between requests.

Old version 2 OpenSearch cursors are incompatible. After updating, start an
existing search again without `cursor`. The search endpoint and its pagination
are documented in [Kaiten's API reference](https://developers.kaiten.ru/cards/retrieve-card-list).

Summaries include ID, title, location, state, condition, archive flag, due date,
owner ID and update time when present. Details additionally include the full
description, priority, size, type, location names, owner, memberships, tags,
properties and checklist references. Comments and checklist item content use
separate tools. Mutation results project fields from the write response without
an additional read; fields absent in that response stay absent.

```json
{
  "card_id": 123,
  "changes": {
    "description": "## Delivery\nImplement the agreed workflow.",
    "due_date": "2026-10-15",
    "asap": false
  }
}
```

## Comments, memberships and tags

| Tool                             | Arguments                       | Behavior                                                          |
| -------------------------------- | ------------------------------- | ----------------------------------------------------------------- |
| `kaiten_list_comments`           | `card_id`, `page`               | Full text and available author/timestamp fields; local pagination |
| `kaiten_add_comment`             | `card_id`, `text`               | Add a text comment                                                |
| `kaiten_update_comment`          | `card_id`, `comment_id`, `text` | Replace comment text                                              |
| `kaiten_delete_comment`          | `card_id`, `comment_id`         | Delete a comment                                                  |
| `kaiten_list_card_members`       | `card_id`, `page`               | Membership IDs, user IDs, names and role type; local pagination   |
| `kaiten_add_card_member`         | `card_id`, `user_id`            | Add an existing user                                              |
| `kaiten_update_card_member_role` | `card_id`, `member_id`, `type`  | Make the member responsible with `type: 2`                        |
| `kaiten_remove_card_member`      | `card_id`, `member_id`          | Remove a membership                                               |
| `kaiten_list_card_tags`          | `card_id`, `page`               | Attached tags including `tag_id`; local pagination                |
| `kaiten_add_card_tag`            | `card_id`, `name`               | Attach by name; Kaiten may create a missing tag                   |
| `kaiten_remove_card_tag`         | `card_id`, `tag_id`             | Detach a tag                                                      |

Use the membership `id` for `member_id`, and its `user_id` for the user. For tag
removal use `tag_id` from the card tag list. Successful deletion responses contain
the ID confirmed by Kaiten.

Role updates accept only `type: 2`. Their result contains `card_id`, `user_id`,
`type` and available timestamps; Kaiten does not return a membership `id`.

## Checklists

| Tool                           | Arguments                                       | Behavior                                        |
| ------------------------------ | ----------------------------------------------- | ----------------------------------------------- |
| `kaiten_list_checklists`       | `card_id`, `page`                               | Read references from the card; local pagination |
| `kaiten_get_checklist`         | `card_id`, `checklist_id`                       | Read the checklist and all its items            |
| `kaiten_create_checklist`      | `card_id`, `name`, `sort_order?`                | Create an empty checklist                       |
| `kaiten_update_checklist`      | `card_id`, `checklist_id`, `changes`            | Update `name` and/or `sort_order`               |
| `kaiten_delete_checklist`      | `card_id`, `checklist_id`                       | Remove the checklist from the card              |
| `kaiten_add_checklist_item`    | `card_id`, `checklist_id`, `text`, item fields  | Add an item                                     |
| `kaiten_update_checklist_item` | `card_id`, `checklist_id`, `item_id`, `changes` | Change supplied item fields                     |
| `kaiten_delete_checklist_item` | `card_id`, `checklist_id`, `item_id`            | Delete an item                                  |

Optional item fields: `checked`, `sort_order`, `due_date`, `responsible_id`.
Item changes support these fields and `text`. `checked: true` marks completion;
`false` clears it. `due_date: null` clears the deadline and `responsible_id: null`
clears responsibility on update. `text: null` or an empty string clears item text
on update; adding an item requires nonempty text. An update requires at least one
field.

## Existing custom properties

| Tool                                   | Arguments                        | Behavior                                               |
| -------------------------------------- | -------------------------------- | ------------------------------------------------------ |
| `kaiten_list_custom_properties`        | `query?`, `page`                 | Find definitions with type and settings                |
| `kaiten_get_custom_property`           | `property_id`                    | Get one definition                                     |
| `kaiten_list_select_values`            | `property_id`, `query?`, `page`  | Find existing select option IDs and values             |
| `kaiten_list_catalog_values`           | `property_id`, `query?`, `page`  | Find existing catalog value IDs and values             |
| `kaiten_list_custom_directories`       | `query?`, `page`                 | Read directories with field definitions                |
| `kaiten_list_custom_directory_records` | `directory_id`, `query?`, `page` | Read existing records with their values                |
| `kaiten_set_card_properties`           | `card_id`, `properties`          | Assign or clear a nonempty map of card property values |

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
sent. Definitions, options and directory records are read-only in this version.

```json
{
  "card_id": 123,
  "properties": {
    "id_7": [12, 13],
    "id_8": null
  }
}
```
