# Расширенные операции клиента

[Управление автоматизациями](./automations.md) расширяет инструменты навигации.

[Документы, группы и схемы](./documents.md) используют отдельные инструменты чтения/изменения.

[Service Desk и SLA](./service-desk.md) расширяют сервисные сценарии.

[Итерации и прежние спринты](./planning.md) расширяют сценарии планирования.

[Учёт времени и отчёты](./time-tracking.md) расширяют инструменты карточек.

[Общие чек-листы и шаблоны](./checklist-templates.md) расширяют инструменты чек-листов.

См. также [пользователей и права доступа](./identity.md).
Управление типами и создание тегов описаны в разделе
[типов карточек и тегов](./taxonomy.md).
Определения, варианты, оценки и голоса описаны в
[управлении пользовательскими полями](./custom-fields.md).

Расширенные операции предоставляют полные публичные контракты закреплённого
`@2chevskii/kaiten-client` **1.1.0**. Используйте их, когда нужны поля за
пределами удобных операций из [справочника инструментов](./tools.md).

В `request.operation` передавайте точное имя `resource.method`. Имена аргументов
верхнего уровня соответствуют параметрам клиента в `snake_case`. Поля вложенных
`body` и `query` сохраняют написание upstream, включая camelCase там, где его
использует API Kaiten. Схема инструмента перечисляет все допустимые поля,
перечисления, обязательные и nullable-значения. Неизвестные поля отклоняются,
в том числе внутри типизированных тел. JSON-словари допускают произвольные ключи.

Результат `{result: ...}` возвращается в `structuredContent` и как JSON-текст.
Он сохраняет полный JSON-ответ клиента, включая поля, отсутствующие в удобных
проекциях. Операции списков возвращают исходный список или страницу: локальная
пагинация и автоматическая загрузка следующих страниц не применяются.
Успешные операции без тела ответа возвращают `{result: null}`.

Действуют те же права токена, таймауты, отмена и обработка ошибок без раскрытия
секретов. Некорректные аргументы возвращают ошибку MCP с деталями проверки.
HTTP-ошибки содержат `KAITEN_HTTP_ERROR` и исходный статус:
например, 403 означает недостаточные права, 404 — недоступную сущность.

## Управление рабочим пространством

Чтение использует `kaiten_navigation_read`, изменения —
`kaiten_navigation_write`. Сервер предоставляет **18 инструментов** при жёстком
ограничении в 20.

| Ресурс        | Операции после `resource.`                                                              | Аргументы                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `spaces`      | `createNewSpace`, `updateSpace`, `removeSpace`, `retrieveSpace`, `retrieveListOfSpaces` | `body` для создания; `space_id` и `body` для изменения; `space_id` для чтения/удаления; `limit?`, `offset?` для списка      |
| `spaceBoards` | `createNewBoard`, `getBoard`, `getListOfBoards`, `updateBoard`, `removeBoard`           | `space_id`; `body` для создания/изменения; `id` для чтения/изменения/удаления; `force?` для удаления                        |
| `boards`      | `getBoard`                                                                              | `board_id`                                                                                                                  |
| `columns`     | `createNewColumn`, `getListOfColumns`, `updateColumn`, `removeColumn`                   | `board_id`; `body` для создания/изменения; `column_id` для изменения/удаления; `force?` для удаления                        |
| `subcolumn`   | `createNewSubcolumn`, `getListOfSubcolumns`, `updateSubcolumn`, `removeSubcolumn`       | `column_id`; `body` для создания/изменения; `subcolumn_id` для изменения/удаления; `force?` для удаления                    |
| `lanes`       | `createNewLane`, `getListOfLanes`, `updateLane`, `removeLane`                           | `board_id`; `body` для создания/изменения; `lane_id` для изменения/удаления; `condition?` для списка; `force?` для удаления |

Создание поддерживает начальные колонки/дорожки, внешние идентификаторы и
поведение доски. Изменения поддерживают все поля клиента: WIP-лимиты, правила
архивации, приостановку SLA, теги по умолчанию, конфигурацию полей карточек,
права/настройки пространств и перемещение досок между пространствами.
Тело изменения должно содержать хотя бы одно поле. Пропущенные поля не
меняются; `null` очищает только nullable-поля. Принудительное удаление может
удалять контейнеры с карточками; не передавайте `force`, чтобы сохранить
стандартные ограничения Kaiten.

Создание доски через `kaiten_navigation_write`:

```json
{
  "request": {
    "operation": "spaceBoards.createNewBoard",
    "args": {
      "space_id": 1,
      "body": {
        "title": "Delivery",
        "columns": [{"title": "Queue", "type": 1}],
        "lanes": [{"title": "Default"}]
      }
    }
  }
}
```

Чтение полной конфигурации колонок через `kaiten_navigation_read`:

```json
{"request": {"operation": "columns.getListOfColumns", "args": {"board_id": 2}}}
```

## Расширенные операции карточек и поиска

Чтение ниже использует `kaiten_cards_read`, изменения — `kaiten_cards_write`.
Операции используют существующие инструменты: общее число остаётся равным 18.

| Операция                              | Аргументы                | Поведение                                                                                                              |
| ------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `cards.createNewCard`, `cards.create` | `body`                   | Эквивалентные методы клиента: ответственный, email владельца, сервис, внешний ID, позиция, формат текста и свойства    |
| `cards.updateCard`                    | `card_id`, `body`        | Полный контракт изменения, включая трудозатраты, пересчёт планирования, флаг комментария, порядок и формат текста      |
| `cards.deleteCard`                    | `card_id`                | Удаление с сохранением полного ответа                                                                                  |
| `cards.retrieveCard`                  | `card_id`, `broken_api?` | Полный ответ карточки, включая ссылки на файлы и связи                                                                 |
| `cards.retrieveCardBaselines`         | `card_id`                | Неархивные базовые планы неархивных проектов                                                                           |
| `cards.retrieveCardLocationHistory`   | `card_id`                | История перемещений карточки                                                                                           |
| `cards.batchUpdateForCards`           | `body`                   | Изменение карточек по селектору или сортировка колонки/дорожки; возвращается ID задания, а не подтверждение завершения |
| `cards.retrieveCardList`              | `query?`                 | Полный поиск: исключения, сортировка, текстовые проекции и пагинация v1/v2                                             |
| `cards.iterate`                       | `query?`, `max_items?`   | Итератор клиента по страницам v2, по умолчанию до 100 элементов (1–1 000)                                              |
| `encodeCardFilter`                    | `filter`                 | Локальное кодирование структурированного фильтра без HTTP                                                              |

Массовое изменение требует `attributes` и хотя бы один селектор (`board_id`,
`column_id`, `lane_id`, `owner_id`, `type_id`, `condition`) либо все три поля
`column_id`, `lane_id`, `order_by`. Операция может затронуть много карточек.

Поиск v1 возвращает массив; v2 — `{result: [...], position: "..."}` внутри
внешнего `{result}`. Для следующей страницы v2 сохраняйте фильтры и передавайте
`position` в `query.start_position`. Пустая позиция обозначает последнюю страницу.
`query.filter` принимает закодированную строку или двухуровневый фильтр клиента
с `and`/`or`; клиент выполняет UTF-8 base64-кодирование. Поддерживаются предикаты
обычных полей, путей, дат, источника и пользовательских полей. Числовые значения
в сравнениях пользовательских полей передаются строками.

`cards.iterate` возвращает `{result: {items, truncated}}`. Итератор клиента
закрывается при завершении, ошибке или достижении лимита; для определения
усечения может быть прочитан один дополнительный элемент. Снимок не содержит
курсора продолжения. Для возобновляемой пагинации используйте
`cards.retrieveCardList`. Таймаут и отмена относятся ко всему обходу.

Чтение страницы v2 через `kaiten_cards_read`:

```json
{
  "request": {
    "operation": "cards.retrieveCardList",
    "args": {
      "query": {
        "version": 2,
        "board_id": 2,
        "additional_card_fields": ["description"],
        "filter": {
          "key": "and",
          "value": [
            {"key": "and", "value": [{"key": "asap", "comparison": "true"}]}
          ]
        }
      }
    }
  }
}
```

## Блокировки и связи

Чтение и изменения используют существующие инструменты ниже; общее число
остаётся равным 18. Все расширенные операции возвращают полный ответ в
`{result}`. Списки возвращаются целиком, без локальной пагинации.

| Ресурс                  | Операции после `resource.`                                                                               | Группа инструментов и аргументы                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cardAllowedUsers`      | `retrieveUsersList`                                                                                      | `relations_read`: `card_id`, `query?` (`type`, `search`, `orderBy`, `role`, `limit`, `offset`)                                                   |
| `cardBlockers`          | `blockCard`, `retrieveCardBlockersList`, `updateCardBlockers`, `deleteCardBlockers`                      | `relations_read`/`relations_write`: `card_id`; `body` для создания/изменения; `blocker_id` для изменения/удаления                                |
| `cardBlockerUsers`      | `addUserToTheCardBlocker`, `removeUser`, `retrieveListOfUsers`, `retrieveBlockersCardsListOnCurrentUser` | `relations_read`/`relations_write`: `blocker_id`; `user_id` для добавления/удаления; без аргументов для блокировок текущего пользователя         |
| `cardBlockerCategories` | `addBlockerCategory`, `removeCategory`, `retrieveListOfCategories`                                       | `relations_read`/`relations_write`: `blocker_id` и `name` для добавления, `blocker_id` и `category_uuid` для удаления; без аргументов для списка |
| `cardPlannedRelations`  | `addPlannedRelation`, `updatePlannedRelation`, `removePlannedRelation`                                   | `relations_write`: `card_id`, `body` для добавления/изменения; `target_card_id` для изменения/удаления                                           |
| `cardMembers`           | `addMemberToCard`, `removeMemberFromCard`, `retrieveListOfCardMembers`, `updateMemberRole`               | `relations_read`/`relations_write`: `card_id`; `user_id` для добавления; `member_id` для удаления/изменения; `type: 2` для изменения роли        |
| `cardTags`              | `addTag`, `removeTagFromCard`, `rertrieveListOfTags`                                                     | `relations_read`/`relations_write`: `card_id`; `name` для добавления; `tag_id` для удаления                                                      |
| `cardChildren`          | `addChildren`, `removeChildren`, `retrieveCardChildrenList`                                              | `children_read`/`children_write`: `parent_card_id`, `child_card_id` для добавления; `card_id`, `id` для удаления; `card_id` для списка           |
| `cardExternalLinks`     | `addExternalLink`, `removeExternalLink`, `retrieveCardExternalLinks`, `updateExternalLink`               | `external_links_read`/`external_links_write`: `card_id`; `url`, `description?` для добавления; `id` для удаления/изменения; `body` для изменения |

Имена групп в таблице имеют префикс `kaiten_`. `rertrieveListOfTags` сохраняет
написание метода upstream; удобная операция `list_card_tags` также доступна.

Тело блокировки должно содержать `reason` или `blocker_card_id`. Изменение также
принимает `due_date` и `due_date_time_present`, включая `null`, но контракт
клиента по-прежнему требует `reason` или `blocker_card_id` в этом запросе.

Плановые связи соединяют `card_id` (предшественник) с `target_card_id`
(последователь), независимо от иерархии и блокировок. Тело добавления содержит
`target_card_id` и `type`: `end-start`, `start-start`, `end-end` или `start-end`.
Можно изменять `type`, знаковый `gap` или `gap_type` (`hours` или `days`). Для
очистки интервала передайте одновременно `gap: null` и `gap_type: null`.
Частичное изменение интервала требует, чтобы интервал уже существовал в Kaiten.
Удаление плановой связи не изменяет даты карточек.

Создание зависимости через `kaiten_relations_write`:

```json
{
  "request": {
    "operation": "cardPlannedRelations.addPlannedRelation",
    "args": {"card_id": 10, "body": {"target_card_id": 20, "type": "end-start"}}
  }
}
```
