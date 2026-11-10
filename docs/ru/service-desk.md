# Service Desk и SLA

Эти [расширенные операции](./api.md) используют `kaiten_cards_read` и
`kaiten_cards_write`; общее число остаётся равным 20. Полные ответы клиента
сохраняются в `{result}`.

| Операция                                            | Аргументы                   | Инструмент           |
| --------------------------------------------------- | --------------------------- | -------------------- |
| `serviceDeskServices.retrieveServicesList`          | Нет                         | `kaiten_cards_read`  |
| `cardSla.retrieveCardSlaMeasurements`               | `card_id`                   | `kaiten_cards_read`  |
| `cardServiceDeskExternalRecipients.addNewRecipient` | `card_id`, непустой `email` | `kaiten_cards_write` |
| `cardServiceDeskExternalRecipients.removeRecipient` | `card_id`, непустой `email` | `kaiten_cards_write` |

Список сервисов сохраняет маршрутизацию, расположение/тип карточек, настройки
полей, email-маски и политику внешних получателей, если они возвращаются Kaiten.
ID сервиса можно передать в `service_id` расширенного создания/изменения
карточки. SLA сохраняет календари, рабочие дни, праздники и исходные метрики
`rulesTimeData` без преобразования единиц или агрегирования. Списки передаются
без локальной пагинации.

Изменения получателей используют публичные методы клиента для карточки.
Клиент безопасно кодирует email в URL удаления, включая плюс и `@`. Kaiten
проверяет формат email, права токена и политику сервиса. HTTP-ошибки возвращают
статус и безопасное сообщение без приватных деталей upstream и автоматических
повторных запросов записи.

Добавление получателя через `kaiten_cards_write`:

```json
{
  "request": {
    "operation": "cardServiceDeskExternalRecipients.addNewRecipient",
    "args": {"card_id": 10, "email": "person+tag@example.com"}
  }
}
```
