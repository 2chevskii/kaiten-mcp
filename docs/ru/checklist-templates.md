# Общие чек-листы и шаблоны пространств

Читайте чек-листы карточек и шаблоны через `kaiten_checklists_read`, изменяйте через `kaiten_checklists_write`. Перед изменением общего чек-листа проверьте связанные карточки через `list_cards_using_checklist`. Для копирования и переноса передавайте `body`.

| Область         | Операции                                                                                                          | Аргументы                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Чек-листы       | `create_checklist`, `get_checklist`, `update_checklist`, `delete_checklist`                                       | `card_id`; `body` для добавления/изменения; `checklist_id` для чтения/изменения/удаления                                           |
| Пункты карточки | `add_checklist_item`, `update_checklist_item`, `delete_checklist_item`                                            | `card_id`, `checklist_id`; `body` для добавления/изменения; `item_id` для изменения/удаления                                       |
| Общие пункты    | `add_checklist_item`, `update_checklist_item`, `delete_checklist_item`                                            | `checklist_id`; `body` для добавления/изменения; `item_id` для изменения/удаления                                                  |
| Общие чек-листы | `list_cards_using_checklist`                                                                                      | `id`, обязательный логический `only_shared_cards`                                                                                  |
| Шаблоны         | `create_checklist_template`, `list_checklist_templates`, `update_checklist_template`, `delete_checklist_template` | `space_uid`; `name`, `sort_order?` для создания; `template_checklist_uid` для изменения/удаления; `body` для изменения             |
| Пункты шаблона  | `add_checklist_template_item`, `update_checklist_template_item`, `delete_checklist_template_item`                 | `space_uid`, `template_checklist_uid`; `text`, `sort_order?` для создания; `item_uid` для изменения/удаления; `body` для изменения |

Создание чек-листа принимает `name` или `source_share_id`, порядок,
`items_source_checklist_id` и `exclude_item_ids` для копирования выбранных
пунктов. Изменение позволяет переименовать/упорядочить чек-лист или переместить
его с помощью `card_id` в теле. Пункты поддерживают текст, выполнение, срок,
ответственного и порядок; изменение также принимает целевой `checklist_id` и
nullable-текст, ответственного и срок. Предоставлены как API пункта внутри
карточки, так и глобальный API пункта.

Шаблоны пространств используют UID. Изменение шаблона принимает имя, порядок и
необязательный целевой `space_uid`; контракт клиента требует вместе с целевым
пространством изменение имени или порядка. Пункт шаблона принимает текст/порядок.
Пустые изменения отклоняются; нулевой порядок, false и явные null сохраняются.
Списки возвращают исходный ответ без локальной пагинации.

Копирование чек-листа через `kaiten_checklists_write`:

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
