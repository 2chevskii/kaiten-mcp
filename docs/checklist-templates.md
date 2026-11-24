# Shared checklists and space templates

Use `kaiten_checklists_read` to find card checklists and space templates and `kaiten_checklists_write` to change them. Before editing a shared checklist, use `list_cards_using_checklist` to identify affected cards. Supply a native `body` to copy, share or move a checklist.

| Area              | Operations                                                                                                        | Arguments                                                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Checklists        | `create_checklist`, `get_checklist`, `update_checklist`, `delete_checklist`                                       | `card_id`; `body` for add/update; `checklist_id` for get/update/remove                                                   |
| Card-scoped items | `add_checklist_item`, `update_checklist_item`, `delete_checklist_item`                                            | `card_id`, `checklist_id`; `body` for add/update; `item_id` for update/remove                                            |
| Shared items      | `add_checklist_item`, `update_checklist_item`, `delete_checklist_item`                                            | `checklist_id`; `body` for add/update; `item_id` for update/remove                                                       |
| Shared checklists | `list_cards_using_checklist`                                                                                      | `id`, `only_shared_cards` (required boolean)                                                                             |
| Templates         | `create_checklist_template`, `list_checklist_templates`, `update_checklist_template`, `delete_checklist_template` | `space_uid`; `name`, `sort_order?` for create; `template_checklist_uid` for update/remove; `body` for update             |
| Template items    | `add_checklist_template_item`, `update_checklist_template_item`, `delete_checklist_template_item`                 | `space_uid`, `template_checklist_uid`; `text`, `sort_order?` for create; `item_uid` for update/remove; `body` for update |

Checklist creation accepts a `name` or `source_share_id`, plus ordering,
`items_source_checklist_id` and `exclude_item_ids` for copying selected items.
Checklist updates can rename/reorder or move a checklist with body `card_id`.
Item bodies support text, checked status, due date, responsible user and order;
updates additionally accept a destination `checklist_id` and nullable text,
responsible user and due date. Card-scoped and global item APIs are both exposed.

Space templates use UIDs. Template updates accept name, order and optional
destination `space_uid`; the client's contract requires a name or order change
alongside that destination. Template-item updates accept text/order. Empty
update bodies are rejected, and zero order, false checked status and explicit
nulls are preserved. Lists return the upstream list without local pagination.

Copy a checklist with `kaiten_checklists_write`:

```json
{
  "request": {
    "operation": "create_checklist",
    "args": {
      "card_id": 10,
      "body": {
        "name": "Copy",
        "items_source_checklist_id": 8,
        "exclude_item_ids": [9]
      }
    }
  }
}
```
