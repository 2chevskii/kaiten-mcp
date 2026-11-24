# Shared checklists and space templates

Use `list_checklists` to find checklist IDs on a card and `get_checklist` to read
complete item details. The canonical write pair uses a single operation name for
each intent. Supply a native body to copy or share a checklist or move it to
another card. When editing a shared checklist, first call
`list_cards_using_checklist` to review the affected cards.

Use `list_checklist_templates` to find space templates and their item UIDs.
Template writes change the reusable defaults in a space.

The table shows v2 operation names for `KAITEN_TOOL_PROFILE=legacy`. Their
responses preserve the complete client JSON in `{result}`.

| Resource                      | Operations after `resource.`                                                                                                          | Arguments                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `cardChecklists`              | `addChecklistToCard`, `retrieveCardChecklist`, `updateChecklist`, `removeChecklistFromCard`                                           | `card_id`; `body` for add/update; `checklist_id` for get/update/remove                                                   |
| `cardChecklistItems`          | `addItemToChecklist`, `updateChecklistItem`, `removeChecklistItem`                                                                    | `card_id`, `checklist_id`; `body` for add/update; `item_id` for update/remove                                            |
| `checklistItems`              | `addItemToChecklist`, `updateChecklistItem`, `removeChecklistItem`                                                                    | `checklist_id`; `body` for add/update; `item_id` for update/remove                                                       |
| `checklists`                  | `retrieveCardsWithChecklist`                                                                                                          | `id`, `only_shared_cards` (required boolean)                                                                             |
| `spaceTemplateChecklist`      | `createNewSpaceTemplateChecklist`, `getListOfSpaceTemplateChecklists`, `updateSpaceTemplateChecklist`, `removeSpaceTemplateChecklist` | `space_uid`; `name`, `sort_order?` for create; `template_checklist_uid` for update/remove; `body` for update             |
| `spaceTemplateChecklistItems` | `createNewSpaceTemplateChecklistItem`, `updateSpaceTemplateChecklistItem`, `removeSpaceTemplateChecklistItem`                         | `space_uid`, `template_checklist_uid`; `text`, `sort_order?` for create; `item_uid` for update/remove; `body` for update |

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
