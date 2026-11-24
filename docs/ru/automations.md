# Автоматизации

Получите список правил по числовому `space_id` через `list_automations` в `kaiten_workflows_read`. Передайте UID правила в `kaiten_workflows_write` для его изменения или удаления.

Для триггеров итераций нужна функция «Итерации».
Правила `on_action` с `iteration_card_added` или `iteration_card_removed`
срабатывают при добавлении или удалении карточки. Правила `on_date` с
`iteration_start_date_on_date` или `iteration_finish_date_on_date` привязаны к
дате начала или окончания итерации пространства. Настройки расписания
передаются в `trigger.data`. [Документация API Kaiten](https://developers.kaiten.ru/automations/create-automation).

| Операция            | Аргументы                            | Инструмент               |
| ------------------- | ------------------------------------ | ------------------------ |
| `list_automations`  | `space_id`                           | `kaiten_workflows_read`  |
| `create_automation` | `space_id`, `body`                   | `kaiten_workflows_write` |
| `update_automation` | `space_id`, `automation_uid`, `body` | `kaiten_workflows_write` |
| `delete_automation` | `space_id`, `automation_uid`         | `kaiten_workflows_write` |

Тела создания `on_action` и `on_date` требуют `trigger` и допускают `name`
и рекурсивные `conditions`. Для `on_demand` обязателен `name`, а триггер
и условия не передаются. Каждый вариант требует хотя бы одно действие.
Действие содержит непустой `type`, JSON-объект `data` и необязательный `created`.

Триггер допускает необязательные `hasToFireOnCardCreation` и `data`. Группа условий содержит
`clause: "and"` или `"or"` и массив `conditions` с условиями или вложенными
группами. Условие содержит `type`, необязательные `operator`, `data` и `created`.
Поле `created` группы также сохраняется. Имена действий/условий и их JSON-данные
интерпретирует Kaiten; используйте значения, поддерживаемые вашим экземпляром.

Изменение использует частичное тело клиента, включая пустой объект.
Переданный массив действий должен оставаться непустым. Отдельных операций
изменения статуса или запуска в закреплённом клиенте нет. Чтение сохраняет
полный ответ в `{result}`, включая статус, порядок, триггеры и действия.
Kaiten проверяет права и доступность функции; действуют общие таймауты,
отмена и HTTP-ошибки без раскрытия секретов.

Просмотр существующих определений через `kaiten_workflows_read`:

```json
{
  "request": {
    "operation": "list_automations",
    "args": {"space_id": 1}
  }
}
```
