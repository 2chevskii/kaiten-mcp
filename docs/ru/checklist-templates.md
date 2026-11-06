# Общие чек-листы и шаблоны пространств

Эти [расширенные операции](./api.md) используют `kaiten_checklists_read` и
`kaiten_checklists_write`; общее число остаётся равным 16. Полный JSON-ответ
клиента сохраняется в `{result}`. Существующие удобные операции чек-листов
остаются доступны.

| Ресурс                        | Операции после `resource.`                                                                                                            | Аргументы                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `cardChecklists`              | `addChecklistToCard`, `retrieveCardChecklist`, `updateChecklist`, `removeChecklistFromCard`                                           | `card_id`; `body` для добавления/изменения; `checklist_id` для чтения/изменения/удаления                                           |
| `cardChecklistItems`          | `addItemToChecklist`, `updateChecklistItem`, `removeChecklistItem`                                                                    | `card_id`, `checklist_id`; `body` для добавления/изменения; `item_id` для изменения/удаления                                       |
| `checklistItems`              | `addItemToChecklist`, `updateChecklistItem`, `removeChecklistItem`                                                                    | `checklist_id`; `body` для добавления/изменения; `item_id` для изменения/удаления                                                  |
| `checklists`                  | `retrieveCardsWithChecklist`                                                                                                          | `id`, обязательный логический `only_shared_cards`                                                                                  |
| `spaceTemplateChecklist`      | `createNewSpaceTemplateChecklist`, `getListOfSpaceTemplateChecklists`, `updateSpaceTemplateChecklist`, `removeSpaceTemplateChecklist` | `space_uid`; `name`, `sort_order?` для создания; `template_checklist_uid` для изменения/удаления; `body` для изменения             |
| `spaceTemplateChecklistItems` | `createNewSpaceTemplateChecklistItem`, `updateSpaceTemplateChecklistItem`, `removeSpaceTemplateChecklistItem`                         | `space_uid`, `template_checklist_uid`; `text`, `sort_order?` для создания; `item_uid` для изменения/удаления; `body` для изменения |

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
    "operation": "cardChecklists.addChecklistToCard",
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
