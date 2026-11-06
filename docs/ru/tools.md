# Справочник инструментов

Сервер предоставляет 15 инструментов. Пошаговые примеры находятся
в [сценариях](./workflows.md), диагностика ошибок — в
[решении проблем](./troubleshooting.md).

Все имена имеют префикс `kaiten_`. Аргументы используют `snake_case`.
Числовые ID — положительные целые в безопасном диапазоне JavaScript; ID
справочников — строки UUID. Знак `?` обозначает необязательный аргумент.
Неизвестные аргументы отклоняются.

`page` означает необязательные `limit` (1–100, по умолчанию 25) и `offset`
(по умолчанию 0). Ответ списка: `{items, next_offset}`; поиска карточек:
`{items, next_cursor}`; одной сущности: `{item}`. Каждый ответ также содержит
эквивалентный JSON текст.

Каждая операция вызывается через указанный инструмент: передайте аргументы как `{"request":{"operation":"get_card","args":{"card_id":123}}}` в `kaiten_cards_read`. В таблицах в скобках указано значение `operation`, а в столбце аргументов — содержимое `args`. Имена прежних отдельных инструментов больше не доступны.

## Контракты результатов

Успешные вызовы возвращают результат в `structuredContent` и тот же JSON
текстовым элементом в `content`. Примеры показывают только структурированный
результат:

```json
{"item": {"id": 5, "full_name": "Алексей"}}
```

```json
{"items": [{"id": 1, "title": "Работа"}], "next_offset": null}
```

```json
{
  "items": [{"id": 123, "title": "Релиз", "board_id": 2, "column_id": 3}],
  "next_cursor": null
}
```

Сервер проверяет результат каждой операции по её схеме; общая MCP-схема допускает описанные ниже форматы результата.
Необязательные поля присутствуют, только если их вернул Kaiten; неизвестные
upstream-поля удаляются. Отсутствующее поле отличается от явного `null`.

Инструменты чтения объявляют `readOnlyHint: true` и `idempotentHint: true`.
Инструменты записи объявляют `destructiveHint: true`, поскольку объединяют создание, изменение и удаление. Все инструменты записи объявляют `readOnlyHint: false`
и `idempotentHint: false`. У всех инструментов `openWorldHint: true`.
Аннотации информируют MCP-клиент; доступ в Kaiten определяется правами токена.

## Навигация и поиск справочных данных

| Инструмент                                    | Аргументы                     | Результат                                                    |
| --------------------------------------------- | ----------------------------- | ------------------------------------------------------------ |
| `kaiten_navigation_read` (`list_spaces`)      | `page`                        | ID и названия пространств                                    |
| `kaiten_navigation_read` (`get_space`)        | `space_id`                    | Пространство и ссылки на доски, если Kaiten их вернул        |
| `kaiten_navigation_read` (`list_boards`)      | `space_id`, `page`            | ID и названия досок; локальная пагинация                     |
| `kaiten_navigation_read` (`get_board`)        | `board_id`                    | Описание, колонки, дорожки, настройки пользовательских полей |
| `kaiten_navigation_read` (`list_columns`)     | `board_id`, `page`            | ID, названия, порядок и тип колонок; локальная пагинация     |
| `kaiten_navigation_read` (`list_lanes`)       | `board_id`, `page`            | ID, названия и порядок дорожек; локальная пагинация          |
| `kaiten_navigation_read` (`get_current_user`) | Нет                           | ID, имя и доступные данные текущего пользователя             |
| `kaiten_navigation_read` (`list_users`)       | `query?`, `page`              | Пользователи компании с ID, именами и email                  |
| `kaiten_navigation_read` (`list_card_types`)  | `page`                        | Существующие ID и названия типов карточек                    |
| `kaiten_navigation_read` (`list_tags`)        | `query?`, `space_id?`, `page` | ID, названия и цвета тегов                                   |

Локальная пагинация получает один полный список из API и выделяет нужную
страницу. Результат не кешируется; дополнительные страницы API автоматически
не запрашиваются.

Поле колонки `column_id` содержит ID родительской колонки или `null`, если
родителя нет. Это относится к деталям доски, списку колонок и расположению
карточки в подробном ответе.

## Карточки

| Инструмент                            | Аргументы                                                                        | Действие                                      |
| ------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------- |
| `kaiten_cards_read` (`search_cards`)  | Фильтры ниже, `limit?`, `cursor?`                                                | Поиск version 1 с токеном продолжения сервера |
| `kaiten_cards_read` (`get_card`)      | `card_id`                                                                        | Подробное представление карточки              |
| `kaiten_cards_write` (`create_card`)  | `title`, `board_id`, редактируемые поля, `column_id?`, `lane_id?`, `properties?` | Создать карточку                              |
| `kaiten_cards_write` (`update_card`)  | `card_id`, `changes`                                                             | Изменить переданные поля                      |
| `kaiten_cards_write` (`move_card`)    | `card_id`, `board_id`, `column_id`, `lane_id`                                    | Переместить в заданное расположение           |
| `kaiten_cards_write` (`archive_card`) | `card_id`                                                                        | Установить архивное состояние (`2`)           |
| `kaiten_cards_write` (`restore_card`) | `card_id`                                                                        | Восстановить активное состояние (`1`)         |
| `kaiten_cards_write` (`delete_card`)  | `card_id`                                                                        | Удалить через DELETE endpoint Kaiten          |

Редактируемые поля: `title`, `description`, `due_date`, `due_date_time_present`,
`asap`, `size_text`, `owner_id`, `type_id`. Объект `changes` должен содержать хотя
бы одно поле. Пропущенные поля сохраняются. `null` очищает `description`,
`due_date` или `size_text`. Описание использует стандартный формат Kaiten — Markdown.

Даты принимают `YYYY-MM-DD` или ISO timestamp с явным часовым поясом. Флаги —
boolean, ID — числа. Название должно быть непустой строкой.

Фильтры поиска: `query`, `space_id`, `board_id`, `column_id`, `lane_id`,
`owner_ids`, `member_ids`, `responsible_ids`, `tag_ids`, `type_ids`, `states`,
`archived`, `asap`, `overdue`, `due_date_after`, `due_date_before`.
Фильтры с несколькими ID принимают массивы. `states`: `1` — очередь, `2` — в
работе, `3` — завершено. Для пропущенных фильтров действуют настройки Kaiten.

Для поиска только неархивных карточек передавайте `archived: false`, для архивных —
`archived: true`. Поиск использует endpoint Kaiten version 1, сортировку по ID
карточки и пагинацию через `offset`. Сервер возвращает позицию как `next_cursor`;
передавайте её в `cursor` с теми же фильтрами для следующей страницы. После полной
страницы может потребоваться последний пустой запрос, чтобы получить
`next_cursor: null`. Страницы могут сдвигаться, если подходящие карточки добавлены,
удалены или изменены между запросами.

Старые курсоры version 2 OpenSearch несовместимы. После обновления начните текущий
поиск заново без `cursor`. Endpoint поиска и пагинация описаны в
[справочнике API Kaiten](https://developers.kaiten.ru/cards/retrieve-card-list).

Краткая карточка содержит ID, название, расположение, состояние, архивность,
срок, ID владельца и время изменения при наличии. Подробная карточка также
содержит полное описание, приоритет, оценку, тип, названия расположения,
владельца, участников, теги, поля, родительские и дочерние карточки и ссылки на чек-листы. Комментарии и содержимое
чек-листов читаются отдельно. Ответы изменений используют поля ответа записи
Kaiten без дополнительного чтения; отсутствующие поля не добавляются.

```json
{
  "card_id": 123,
  "changes": {
    "description": "## Реализация\nВыполнить согласованный сценарий.",
    "due_date": "2026-10-15",
    "asap": false
  }
}
```

## Родительские и дочерние карточки

`kaiten_cards_read` (`get_card`) включает `parents` и `children`, если Kaiten возвращает их.
Каждая ссылка содержит ID карточки, название, расположение и доступные поля
краткого представления. Пустые массивы означают отсутствие связей;
отсутствующие поля остаются отсутствующими.

| Инструмент                                    | Аргументы                         | Результат                                             |
| --------------------------------------------- | --------------------------------- | ----------------------------------------------------- |
| `kaiten_children_read` (`list_card_children`) | `parent_card_id`, `page`          | Краткие данные дочерних карточек; локальная пагинация |
| `kaiten_children_write` (`add_card_child`)    | `parent_card_id`, `child_card_id` | Краткие данные связанной дочерней карточки            |
| `kaiten_children_write` (`remove_card_child`) | `parent_card_id`, `child_card_id` | ID, подтверждённый Kaiten                             |

`parent_card_id` — ID родительской карточки, `child_card_id` — ID существующей
дочерней карточки. Добавление связи не создаёт карточку. Удаление связи не
удаляет карточки и другие связи. Используйте `id` дочерней карточки из результата
списка, добавления или `get_card`, а не ID связи.
[Endpoint удаления](https://developers.kaiten.ru/card-children/remove-children)
получает путь `/cards/{parent_card_id}/children/{child_card_id}`.

## Внешние ссылки

Внешние ссылки карточки — отдельный ресурс, не пользовательские свойства.
Пагинация списка выполняется локально. Для изменения и удаления используйте
возвращённый ID ссылки. Данные карточки включают ссылки, если Kaiten их возвращает.

| Инструмент внешних ссылок                                   | Аргументы                                                | Результат                     |
| ----------------------------------------------------------- | -------------------------------------------------------- | ----------------------------- |
| `kaiten_external_links_read` (`list_card_external_links`)   | `card_id`, `limit?`, `offset?`                           | Список ссылок и `next_offset` |
| `kaiten_external_links_write` (`add_card_external_link`)    | `card_id`, `url`, `description?`                         | Созданная ссылка              |
| `kaiten_external_links_write` (`update_card_external_link`) | `card_id`, `link_id`, `changes` (`url?`, `description?`) | Изменённая ссылка             |
| `kaiten_external_links_write` (`remove_card_external_link`) | `card_id`, `link_id`                                     | ID удалённой ссылки           |

URL должен быть корректным абсолютным адресом длиной не более 16 384 символов. Описание допускает до 512 символов; для его очистки передайте `description: null`. При изменении необходимо указать хотя бы одно поле.

## Комментарии, участники и теги

| Инструмент                                           | Аргументы                       | Действие                                                             |
| ---------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------- |
| `kaiten_comments_read` (`list_comments`)             | `card_id`, `page`               | Полный текст, доступные данные автора и времени; локальная пагинация |
| `kaiten_comments_write` (`add_comment`)              | `card_id`, `text`               | Добавить текстовый комментарий                                       |
| `kaiten_comments_write` (`update_comment`)           | `card_id`, `comment_id`, `text` | Заменить текст комментария                                           |
| `kaiten_comments_write` (`delete_comment`)           | `card_id`, `comment_id`         | Удалить комментарий                                                  |
| `kaiten_relations_read` (`list_card_members`)        | `card_id`, `page`               | ID связей, ID пользователей, имена и роли; локальная пагинация       |
| `kaiten_relations_write` (`add_card_member`)         | `card_id`, `user_id`            | Добавить существующего пользователя                                  |
| `kaiten_relations_write` (`update_card_member_role`) | `card_id`, `member_id`, `type`  | Назначить участника ответственным с `type: 2`                        |
| `kaiten_relations_write` (`remove_card_member`)      | `card_id`, `member_id`          | Удалить участника карточки                                           |
| `kaiten_relations_read` (`list_card_tags`)           | `card_id`, `page`               | Прикреплённые теги, включая `tag_id`; локальная пагинация            |
| `kaiten_relations_write` (`add_card_tag`)            | `card_id`, `name`               | Прикрепить по имени; Kaiten может создать отсутствующий тег          |
| `kaiten_relations_write` (`remove_card_tag`)         | `card_id`, `tag_id`             | Снять тег с карточки                                                 |

Для `member_id` используйте `id` связи с карточкой; `user_id` идентифицирует
пользователя. Для снятия тега используйте `tag_id` из списка тегов карточки.
Успешное удаление возвращает ID, подтверждённый Kaiten.

Изменение роли принимает только `type: 2`. Ответ содержит `card_id`, `user_id`,
`type` и доступные даты; Kaiten не возвращает `id` связи с карточкой.

## Чек-листы

| Инструмент                                          | Аргументы                                       | Действие                                         |
| --------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| `kaiten_checklists_read` (`list_checklists`)        | `card_id`, `page`                               | Получить ссылки из карточки; локальная пагинация |
| `kaiten_checklists_read` (`get_checklist`)          | `card_id`, `checklist_id`                       | Получить чек-лист со всеми пунктами              |
| `kaiten_checklists_write` (`create_checklist`)      | `card_id`, `name`, `sort_order?`                | Создать пустой чек-лист                          |
| `kaiten_checklists_write` (`update_checklist`)      | `card_id`, `checklist_id`, `changes`            | Изменить `name` и/или `sort_order`               |
| `kaiten_checklists_write` (`delete_checklist`)      | `card_id`, `checklist_id`                       | Удалить чек-лист карточки                        |
| `kaiten_checklists_write` (`add_checklist_item`)    | `card_id`, `checklist_id`, `text`, поля пункта  | Добавить пункт                                   |
| `kaiten_checklists_write` (`update_checklist_item`) | `card_id`, `checklist_id`, `item_id`, `changes` | Изменить переданные поля пункта                  |
| `kaiten_checklists_write` (`delete_checklist_item`) | `card_id`, `checklist_id`, `item_id`            | Удалить пункт                                    |

Необязательные поля пункта: `checked`, `sort_order`, `due_date`, `responsible_id`.
Изменение также поддерживает `text`. `checked: true` отмечает выполнение, `false`
снимает отметку. `due_date: null` очищает срок, `responsible_id: null` снимает
ответственного при изменении. `text: null` или пустая строка очищает текст пункта
при изменении; добавление требует непустого текста. Требуется хотя бы одно
изменяемое поле.

## Существующие пользовательские поля

| Инструмент                                                        | Аргументы                        | Действие                                               |
| ----------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------ |
| `kaiten_custom_properties_read` (`list_custom_properties`)        | `query?`, `page`                 | Найти определения с типами и настройками               |
| `kaiten_custom_properties_read` (`get_custom_property`)           | `property_id`                    | Получить одно определение                              |
| `kaiten_custom_properties_read` (`list_select_values`)            | `property_id`, `query?`, `page`  | Найти ID и значения вариантов выбора                   |
| `kaiten_custom_properties_read` (`list_catalog_values`)           | `property_id`, `query?`, `page`  | Найти ID и значения каталога                           |
| `kaiten_custom_properties_read` (`list_custom_directories`)       | `query?`, `page`                 | Прочитать справочники с определениями полей            |
| `kaiten_custom_properties_read` (`list_custom_directory_records`) | `directory_id`, `query?`, `page` | Прочитать существующие записи со значениями            |
| `kaiten_custom_properties_write` (`set_card_properties`)          | `card_id`, `properties`          | Записать или очистить непустой набор значений карточки |

Сначала прочитайте определение и нужные варианты. Ключи имеют вид
`id_<положительный ID поля>`. Значения используют JSON формат Kaiten:

| Поле                          | Пример значения                                           |
| ----------------------------- | --------------------------------------------------------- |
| Строка, URL, email, телефон   | `"значение"`                                              |
| Число или рейтинг             | `12`                                                      |
| Выбор или множественный выбор | `[12]` или `[12, 13]` — ID вариантов                      |
| Каталог                       | `"3"` — строковый ID значения                             |
| Пользовательский справочник   | `["12345678-1234-4234-8234-123456789abc"]` — UUID записей |
| Дата                          | `{"date":"2026-10-15","time":"12:00:00","tzOffset":180}`  |
| Очистка значения              | `null`                                                    |

Сервер проверяет ключи и JSON значения; Kaiten проверяет соответствие типу поля
и права. Поля, отсутствующие в `properties`, не отправляются. Определения,
варианты и записи справочников доступны только для чтения.

```json
{
  "card_id": 123,
  "properties": {
    "id_7": [12, 13],
    "id_8": null
  }
}
```
