# Workflows

These examples show tool names and JSON arguments. They describe calls made by
an MCP client; paste the natural-language request into your assistant, or use the
arguments in a client that provides a tool-call interface. All IDs below are
illustrative: replace them with IDs returned by your company.

## Find my active cards

> Find my active cards and group them by board. Show overdue work first.

1. Call `kaiten_get_current_user` with `{}` and read `item.id`.
2. Search using that user ID as an owner filter:

```json
{
  "owner_ids": [5],
  "archived": false,
  "states": [1, 2],
  "limit": 25
}
```

Use these arguments with `kaiten_search_cards`. State `1` is queued, `2` is in
progress, and `3` is done. Add `overdue: true` for an overdue-only search.
For a board-specific request, discover the board ID through `kaiten_list_spaces`
and `kaiten_list_boards`, then add `board_id`.

Ownership, membership and responsibility have separate filters: `owner_ids`,
`member_ids` and `responsible_ids`. Choose the relation the request means.
Run separate searches and deduplicate by card ID when combining those relations.

### Continue a search

If the result contains `next_cursor: "offset:25"`, repeat the original filters
and add `cursor`:

```json
{
  "owner_ids": [5],
  "archived": false,
  "states": [1, 2],
  "limit": 25,
  "cursor": "offset:25"
}
```

Stop when `next_cursor` is `null`. A full final page can require one additional
empty request. Results are ordered by card ID; matching cards changing between
requests can shift offset pages. The cursor carries a position, so preserve the
original filters yourself.

Other list tools return `next_offset`. Pass that number as `offset`, retaining
filters and `limit`, until `next_offset` is `null`.

## Understand a card

> Read card 123, its comments and checklists. Summarize the blocker and unfinished tasks.

| Step                            | Tool                   | Arguments                          |
| ------------------------------- | ---------------------- | ---------------------------------- |
| Read description and references | `kaiten_get_card`      | `{"card_id":123}`                  |
| Read discussion                 | `kaiten_list_comments` | `{"card_id":123,"limit":100}`      |
| Read a referenced checklist     | `kaiten_get_checklist` | `{"card_id":123,"checklist_id":8}` |

Follow comment pagination. Fetch each checklist referenced in the card;
`kaiten_list_checklists` can also list those references. Card details contain
checklist references, while `kaiten_get_checklist` returns the item text and
completion flags. Card search summaries omit descriptions and discussions.

## Create a card and checklist

> Create a release card on the Delivery board with an Implementation checklist.

First discover the space and board. Read `kaiten_get_board` to obtain valid
column and lane IDs belonging to that board. Then call `kaiten_create_card`:

```json
{
  "title": "Prepare the release",
  "board_id": 2,
  "column_id": 3,
  "lane_id": 4,
  "description": "## Goal\nDeliver the agreed release.",
  "due_date": "2026-10-15"
}
```

Use the returned `item.id` for subsequent calls. For a card with ID `123`, call
`kaiten_create_checklist` with `{"card_id":123,"name":"Implementation"}`.
Use its returned checklist ID in `kaiten_add_checklist_item`:

```json
{
  "card_id": 123,
  "checklist_id": 8,
  "text": "Review release notes",
  "responsible_id": 5
}
```

To complete the returned item, call `kaiten_update_checklist_item`:

```json
{
  "card_id": 123,
  "checklist_id": 8,
  "item_id": 13,
  "changes": {"checked": true}
}
```

Each call is a separate operation. If a later step fails, earlier successful
writes remain in Kaiten. After a timed-out create, inspect existing cards or
checklist items before repeating it; the server performs no automatic retries.

## Move, update or archive a card

Use `kaiten_move_card` with all four location IDs:

```json
{"card_id": 123, "board_id": 2, "column_id": 30, "lane_id": 40}
```

Read the target board first to discover its columns and lanes. To edit content,
use `kaiten_update_card` with a nonempty `changes` object:

```json
{
  "card_id": 123,
  "changes": {"description": null, "due_date": "2026-10-15"}
}
```

Omitted fields retain their values. `null` clears supported fields; see the
[editable fields](./tools.md#cards). Archive with `kaiten_archive_card` and restore
with `kaiten_restore_card`, each using `{"card_id":123}`. Archiving changes the
card condition; the queued/in-progress/done state is a separate field.

## Assign members and custom properties

To add an existing user, call `kaiten_add_card_member` with `card_id` and
`user_id`. To make that member responsible, obtain the membership's `id` from
`kaiten_list_card_members` and use it as `member_id` in
`kaiten_update_card_member_role` with `type: 2`.

For custom fields:

1. Read `kaiten_get_board` for the board's property configuration.
2. Find the property with `kaiten_list_custom_properties` and inspect it with
   `kaiten_get_custom_property`.
3. Read existing options using `kaiten_list_select_values`,
   `kaiten_list_catalog_values` or the custom-directory tools as appropriate.
4. Call `kaiten_set_card_properties` using the discovered IDs:

```json
{"card_id": 123, "properties": {"id_7": [12, 13], "id_8": null}}
```

Here `id_7` is an example select property and `id_8` is cleared. The server
validates property keys and JSON values; Kaiten validates field types and
permissions. See the [property value formats](./tools.md#existing-custom-properties).
