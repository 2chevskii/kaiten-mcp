# Миграция с v2

В текущем каталоге 14 инструментов. Замените имя инструмента и операции на канонический вызов. Проверьте `request.args` и формат ответа по схеме из `tools/list`.

Прежние вызовы описаны в [справочнике v3.0.0](https://github.com/2chevskii/kaiten-mcp/blob/v3.0.0/docs/ru/api.md). Текущие домены перечислены в [справочнике](./tools.md).

| Вызов v2                                                                                    | Канонический вызов                                                                                                          |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `kaiten_navigation_read` с `get_current_user`, `list_spaces`, `list_boards` или `get_board` | Та же операция в `kaiten_workspace_read`. Для пагинации передавайте `limit` и `offset` на верхнем уровне `args`.            |
| `spaceBoards.createNewBoard`                                                                | `create_board` в `kaiten_workspace_write` с `space_id` и `body`.                                                            |
| `columns.getListOfColumns`                                                                  | `list_columns` в `kaiten_workspace_read` с `board_id` и `format: "native"`.                                                 |
| `kaiten_comments_read` или `kaiten_relations_read`                                          | `kaiten_collaboration_read`. Для полного ответа `list_comments` передайте `format: "full"` и параметры серверной пагинации. |
| `cardTimeLogs.getTimeLogs`                                                                  | `list_card_time_logs` в `kaiten_workflows_read`. Передайте `next_offset` ответа в `offset`.                                 |
| `iterations.updateIteration`                                                                | `update_iteration` в `kaiten_workflows_write` с теми же `space_uid`, `id` и `body`.                                         |
| `automations.createAutomation` и `automations.updateAutomation`                             | `create_automation` и `update_automation` в `kaiten_workflows_write` с теми же телами запросов.                             |

См. также таблицы миграции для [карточек и совместной работы](../cards-and-collaboration.md#migrating-v2-calls) и [документов и вложений](../content-catalog.md#migrating-v2-calls) на английском.

## Примеры вызовов

Создание доски через `kaiten_workspace_write`.

```json
{
  "request": {
    "operation": "create_board",
    "args": {
      "space_id": 1,
      "body": {
        "title": "Delivery",
        "columns": [
          {
            "title": "Queue",
            "type": 1
          }
        ],
        "lanes": [
          {
            "title": "Default"
          }
        ]
      }
    }
  }
}
```

Чтение полной настройки колонок через `kaiten_workspace_read`.

```json
{
  "request": {
    "operation": "list_columns",
    "args": {
      "board_id": 2,
      "format": "native"
    }
  }
}
```

Создание зависимости через `kaiten_collaboration_write`.

```json
{
  "request": {
    "operation": "add_planned_relation",
    "args": {
      "card_id": 10,
      "body": {
        "target_card_id": 20,
        "type": "end-start"
      }
    }
  }
}
```

## Покрытие клиента и ограничения

Сервер использует публичный `@2chevskii/kaiten-client` **1.3.0** для REST, SCIM, OAuth дополнений и входящих webhooks. Действуют права и доступность функций Kaiten. Объявления метаданных, импорта и браузерных дополнений содержат типы. Сервер работает через stdio и поддерживает скачивание файлов во встроенных ресурсах.
