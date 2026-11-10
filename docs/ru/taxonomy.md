# Типы карточек и теги

Эти [расширенные операции](./api.md) используют `kaiten_navigation_read` и
`kaiten_navigation_write`; общее число остаётся равным 20. Полный ответ клиента
возвращается в `{result}`.

| Ресурс                 | Операции после `resource.`                                                                   | Аргументы                                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `cardTypes`            | `createNewCardType`, `getCardType`, `getListOfCardTypes`, `updateCardType`, `removeCardType` | `body` для создания/изменения; `id` для чтения/изменения/удаления; `replace_type_id` для удаления; `limit?`, `offset?` для списка |
| `cardTypeTreeEntities` | `addTreeEntityToCardType`, `getListOfTypeTreeEntities`, `deleteTreeEntityFromCardType`       | `type_id`; `tree_entity_uid` для добавления; `uid` для удаления                                                                   |
| `tags`                 | `addTag`, `retrieveListOfTags`, `iterate`                                                    | `name`, `query?` для создания; `query?` для списка/обхода; `max_items?` для обхода                                                |

Создание типа требует `name`, `letter` и числовой `color`; также принимаются
`properties`, `card_properties` и `suggest_fields`. Контракт изменения клиента
требует хотя бы одно из `name`, `letter`, `color`, `properties`; вместе с ним
можно передать типизированные `card_properties` и `suggest_fields`. Конфигурации
полей описывают обычное поле или UID поля, порядок, обязательность и UID типа.
Предпочитайте `card_properties`: upstream пометил `properties` как устаревшее.
Удаление типа требует явной замены. Привязки к сущностям дерева определяют, где
доступен тип; успешное удаление привязки возвращает `{result: null}`.

Список тегов принимает `ids` массивом или строкой с запятыми, `space_id`,
`query`, `limit` и `offset`. Создание тега также принимает необязательный query
по контракту клиента. `tags.iterate` сохраняет фильтры и использует offset;
результат `{result: {items, truncated}}` ограничен `max_items` (по умолчанию
100, допустимо 1–1 000). Возможен один дополнительный элемент для определения
усечения; курсор продолжения отсутствует. Для отдельных страниц используйте
`tags.retrieveListOfTags`. Существующие операции тегов карточки по-прежнему
добавляют и удаляют теги у карточек.

Создание типа через `kaiten_navigation_write`:

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
