# Управление пользовательскими полями

См. также [справочники](./directories.md): управление справочниками, полями и записями.

Эти [расширенные операции](./api.md) используют `kaiten_custom_properties_read`
и `kaiten_custom_properties_write`; сервер по-прежнему предоставляет
18 инструментов. Полный ответ клиента сохраняется в `{result}`. Существующие
удобные операции чтения и `set_card_properties` остаются доступны.

| Ресурс                                | Операции после `resource.`                                                                                   | Аргументы                                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `customProperties`                    | `createNewProperty`, `getListOfProperties`, `getProperty`, `updateProperty`, `removeProperty`                | `body` для создания/изменения; `query?` для списка; `property_id` для чтения/изменения/удаления                                    |
| `customPropertySelectValues`          | `createNewSelectValue`, `getListOfSelectValues`, `getSelectValue`, `updateSelectValue`, `removeProperty`     | `property_id`; `value`, `color?` для создания; `query?` для списка; `value_id` для чтения/изменения/удаления; `body` для изменения |
| `customPropertyCatalogValues`         | `createNewCatalogValue`, `getListOfCatalogValues`, `getCatalogValue`, `updateCatalogValue`, `removeProperty` | `property_id`; `body` для создания/изменения; `query?` для списка; `value_id` для чтения/изменения/удаления                        |
| `customPropertyCollectiveScoreValues` | `createNewScoreValue`, `getListOfScoreValues`, `updateScoreValue`                                            | `card_id`, `property_id`; строковый `value` для создания; `value_id` и nullable-строка `value` для изменения                       |
| `customPropertyCollectiveVoteValues`  | `createNewVoteValue`, `getListOfVoteValues`, `updateVoteValue`, `removeVoteValue`                            | `card_id`, `property_id`; `body` для создания; `id`, `number_vote?` для изменения; `id`, `emoji_vote` для удаления                 |
| `customPropertyTreeEntities`          | `addTreeEntityToCustomProperty`, `getListOfCustomPropertyTreeEntities`, `deleteTreeEntityFromCustomProperty` | `property_id`; `tree_entity_uid` для добавления; `uid` для удаления                                                                |

## Определения и формулы

Создание требует `name` и `type` либо `formula` и `formula_source_card`.
Типы: строка, число, URL, формула, дата, email, телефон, флажок, список,
коллективная оценка, голос, коллективное голосование, каталог, пользователь и
вложение. Полное тело поддерживает отображение на фасаде, многострочный текст,
варианты голосования, типы значений, цвета, множественный выбор, создание
значений пользователями, настройки полей и типизированные ограничения/формулы/
настройки голосования в `data`.

Изменение поддерживает имя, флаги фасада/многострочности, состояние
active/inactive, цвета/множественный выбор/создание значений, JSON `data`,
nullable-настройки полей и статус поля прогресса. `null` очищает только
nullable-поля; пропущенные поля не меняются. Схема инструмента перечисляет
полный принимаемый контракт.

## Варианты, оценки и голоса

Изменение варианта списка требует хотя бы одно поле: значение, цвет, состояние,
порядок или флаг удаления. Тело каталога содержит JSON-словарь `value`;
изменение требует `condition` или `value`, дополнительно допускается `deleted`.
Методы `removeProperty` у ресурсов select/catalog удаляют указанное **значение**,
а `customProperties.removeProperty` удаляет поле.

Оценки передаются строками, в том числе числовые; `value: null` очищает оценку.
Создание коллективного голоса требует `emoji_vote` или `number_vote`. Числовой
голос допускает `null` при изменении; удаление emoji-голоса также требует его
строки `emoji_vote`. Нулевые значения и пустые списки сохраняются. Привязки
дерева определяют доступность поля; успешное удаление привязки возвращает
`{result: null}`.

Запросы списков предоставляют все фильтры клиента, флаги авторов/значений и
сортировку. `conditions` вариантов списка — массив `active`, `inactive`,
`removed`; у каталога это строка. Пагинация использует явные `limit` (1–100) и
`offset`, без локального среза ответа. Для списков длиннее лимита upstream в
100 значений загружайте следующие страницы по offset. Массивы ID query
принимают скалярные значения HTTP.

Создание варианта списка через `kaiten_custom_properties_write`:

```json
{
  "request": {
    "operation": "customPropertySelectValues.createNewSelectValue",
    "args": {"property_id": 7, "value": "Urgent", "color": null}
  }
}
```
