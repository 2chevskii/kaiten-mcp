# Входящие webhooks карточек

`sendCardWebhook` в `kaiten_cards_write` вызывает публичную функцию клиента
для создания карточки через существующий webhook Kaiten. Общее число
инструментов остаётся равным 20.

Аргументы — `webhook_url` и `body`. Обязателен `title`; доступны `description`,
`asap`, `due_date`, `owner_id`, `links` (элементы с `url` и необязательным
nullable-полем `description`), `members`, `tags` и `properties`. Сохраняются
исходные имена и JSON-значения. Kaiten проверяет правила маршрутизации и тела.
В `{result}` возвращается полный JSON карточки.

Нужен HTTPS URL без встроенных учётных данных; HTTP loopback разрешён для
локальных интеграций. Токен API Kaiten никогда не отправляется на этот URL,
переходы по редиректам не выполняются. Сам URL webhook является секретом:
храните его в хранилище секретов интеграции и не публикуйте содержащие его
истории вызовов. Действуют общие таймауты, отмена и HTTP-ошибки без раскрытия
секретов, без повторов записи. Определения исходящих событий в клиенте — типы
TypeScript; пакет не предоставляет listener или сервис подписок.

```json
{
  "request": {
    "operation": "sendCardWebhook",
    "args": {
      "webhook_url": "https://your-company.kaiten.ru/your-configured-webhook-path",
      "body": {"title": "Integration task", "asap": false, "tags": ["Backend"]}
    }
  }
}
```

Замените пример на входящий URL из вашего экземпляра Kaiten; пример не задаёт
конкретный путь endpoint.
