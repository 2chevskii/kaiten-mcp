# Файлы и вложения комментариев

Чтение и скачивание используют `kaiten_files_read`, загрузка, изменение
метаданных и удаление — `kaiten_files_write`. Сервер предоставляет ровно
**20 инструментов**. Все запросы API Kaiten выполняются публичными методами
закреплённого клиента **1.1.0**.

## Поиск вложений и идентификаторов

`list_card_files` принимает числовой `card_id`, необязательные `limit`
(1–100, по умолчанию 25) и `offset` (по умолчанию 0). Публичное чтение карточки
возвращает `{card_uid, items, next_offset}` с локальной пагинацией и полными
метаданными файлов. Если старый ответ не содержит UID, `card_uid` равен `null`.
Отсутствующий/некорректный массив `files` вызывает `INVALID_KAITEN_RESPONSE`;
пустой массив — успешный ответ.

Согласно [руководству миграции Kaiten](https://developers.kaiten.ru/restricted-access-files-migration),
одна карточка может содержать прежние файлы с числовыми ID и файлы ограниченного
доступа с UUID (`type: 11`). Для новых операций используйте UUID карточки;
UUID комментариев и полей доступны в полных ответах соответствующих чтений.
`get_legacy_card_file` принимает `card_id` и числовой `file_id`, возвращая
`{result: metadata}` либо `FILE_NOT_FOUND` со статусом 404.

## Публичные операции клиента

Операции возвращают полный исходный JSON в `{result}`. Для `get*` используется
`_read`, для attach/update/delete/detach — `_write`.

| Ресурс                                | Операции после `resource.`                                                                                    | Аргументы                                                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cardFiles` (прежний)                 | `attachFileToCard`, `updateFile`, `detachFileFromCard`                                                        | `card_id`; `file` для attach; числовой `file_id` для update/detach; необязательный `card_cover` для update                                                               |
| `restrictedAccessCardFiles`           | `attachFileToCard`, `getCardFile`, `updateCardFile`, `deleteCardFile`                                         | `card_uid`; `file` для attach; `file_uid` для остальных; необязательные `redirect`, `download` для get; необязательные `name`, `card_cover` для update                   |
| `restrictedAccessCommentFiles`        | `attachFileToComment`, `getCommentFile`, `updateCommentFile`, `deleteCommentFile`                             | `card_uid`, `comment_uid`; `file` для attach; `file_uid` для остальных; необязательный `query: {redirect?, download?}` для get; `body: {name?, card_cover?}` для update  |
| `restrictedAccessCustomPropertyFiles` | `attachFileToCustomProperty`, `getCustomPropertyFile`, `updateCustomPropertyFile`, `deleteCustomPropertyFile` | `card_uid`, `property_uid`; `file` для attach; `file_uid` для остальных; необязательный `query: {redirect?, download?}` для get; `body: {name?, card_cover?}` для update |

Все идентификаторы ограниченного доступа — UUID. Чтение метаданных может
вернуть временный подписанный URL. При `redirect: true` ответ равен
`{result: {location}}`, переход не выполняется. Получайте ссылку перед
использованием и сохраняйте её приватной. Операции скачивания ниже не включают
URL хранилища в ответ.

Новые маршруты требуют настройки ограниченного доступа к файлам в компании.
Прежняя загрузка по числовому ID и multipart комментариев устарела и может быть
отключена Kaiten; автоматической замены семейства маршрутов нет. Ограничение
установки Kaiten может вернуть HTTP 413 независимо от лимита MCP.
См. [справочник загрузки](https://developers.kaiten.ru/restricted-access-card-files/attach-file-to-card).

## Загрузка байтов

`file` содержит `data_base64`, необязательные `filename` и `mime_type`.
Base64 должен быть каноническим, с padding, без пробелов и префикса data URL.
`""` загружает пустой файл. Имя по умолчанию — `file`, MIME-тип —
`application/octet-stream`. Сервер создаёт `Blob`, публичный клиент формирует
multipart и заголовки. Локальные пути файлов не принимаются.

Загрузка трёхбайтного текста через `kaiten_files_write`:

```json
{
  "request": {
    "operation": "restrictedAccessCardFiles.attachFileToCard",
    "args": {
      "card_uid": "11111111-1111-4111-8111-111111111111",
      "file": {
        "filename": "note.txt",
        "mime_type": "text/plain",
        "data_base64": "SGkh"
      }
    }
  }
}
```

Ответ сохраняет UUID файла для чтения, скачивания, изменения и удаления.

## Скачивание через MCP

| Операция в `kaiten_files_read`  | Аргументы                              |
| ------------------------------- | -------------------------------------- |
| `download_card_file`            | `card_uid`, `file_uid`                 |
| `download_comment_file`         | `card_uid`, `comment_uid`, `file_uid`  |
| `download_custom_property_file` | `card_uid`, `property_uid`, `file_uid` |
| `download_legacy_card_file`     | Числовые `card_id`, `file_id`          |

Ограниченные файлы получают временный redirect через публичный клиент,
затем байты хранилища читаются платформенным `fetch` без Authorization и cookie.
Для прежних файлов публичный URL берётся из ответа карточки. Допустимы HTTPS
и HTTP loopback; проверяется каждый URL и выполняется не более пяти переходов
хранилища. Таймаут и отмена действуют на весь вызов.

`structuredContent` и первый JSON-текст содержат только
`{file: {uri, mime_type, size_bytes}}`. Второй элемент `content` передаёт байты
как стандартный встроенный ресурс MCP:

```json
{
  "type": "resource",
  "resource": {
    "uri": "kaiten-file://cards/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222",
    "mimeType": "text/plain",
    "blob": "SGkh"
  }
}
```

MCP-клиент должен поддерживать встроенные бинарные ресурсы. URI обозначает
переданное содержимое и не является отдельным endpoint чтения. Base64 находится
только в `resource.blob`, без дублирования в структурированном и текстовом
ответе. Скачивание происходит в памяти без записи локальных файлов.

## Комментарии и FormData

`cardComments.retrieveCardComments`, `addComment`, `updateComment` и
`removeComment` используют существующие инструменты комментариев и сохраняют
полный JSON с UUID и метаданными вложений. Чтение принимает `card_id`, удаление —
числовые `card_id` и `comment_id`. Добавление принимает `card_id` и ровно одно из
`body: {text}` или `form`. Изменение также принимает `comment_id` и ровно одно из
`body: {text?}` или `form`. Клиент допускает пустое JSON-тело изменения.

`form` — упорядоченный массив строковых частей `{name, value}` или бинарных
`{name, file}` со схемой загрузки. Порядок и повторяющиеся имена сохраняются.
Для прежних вложений используйте `files[]`, если маршрут ещё поддерживается:

```json
{
  "request": {
    "operation": "cardComments.addComment",
    "args": {
      "card_id": 10,
      "form": [
        {"name": "text", "value": "Attached note"},
        {
          "name": "files[]",
          "file": {"filename": "note.txt", "data_base64": "SGkh"}
        }
      ]
    }
  }
}
```

Для ограниченного доступа сначала создайте комментарий, затем используйте его
UUID с `restrictedAccessCommentFiles.attachFileToComment`.
Чтение комментариев закреплённого клиента не принимает параметры пагинации.
[Kaiten ограничивает страницу 100 комментариями](https://developers.kaiten.ru/card-comments/retrieve-card-comments),
поэтому расширенная операция возвращает исходную страницу, а `list_comments`
разбивает её только локально. Полная история не гарантируется.

## Лимиты и ошибки

`KAITEN_MAX_FILE_BYTES` по умолчанию равен **5 242 880 байт (5 MiB)**, допустимы
целые значения от 1 до 104 857 600. Ограничиваются каждый файл и сумма бинарных
частей одной формы комментария. Base64 и multipart увеличивают размер
сообщения; MCP-клиент может применять меньший лимит. При скачивании проверяются
Content-Length и реальные байты потока, превышение отменяет чтение.

| Ошибка                                              | Значение                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| `INVALID_FILE_DATA`                                 | Неканонический base64; загрузка не отправлена                       |
| `FILE_TOO_LARGE`                                    | Превышен локальный лимит; загрузка отклоняется до HTTP              |
| `FILE_NOT_FOUND` со статусом 404                    | Прежний файл отсутствует в карточке                                 |
| `KAITEN_HTTP_ERROR` со статусом 403/404/413         | Нет прав, сущность не найдена или превышен лимит установки Kaiten   |
| `FILE_DOWNLOAD_HTTP_ERROR` со статусом              | Хранилище отклонило скачивание                                      |
| `INVALID_FILE_URL` / `FILE_DOWNLOAD_REDIRECT_ERROR` | Небезопасный URL или некорректная/слишком длинная цепочка переходов |
| `TIMEOUT` / `CANCELLED`                             | Истёк таймаут всего вызова или получена отмена                      |

Ошибки не раскрывают подписанные URL, секреты и приватные ответы сервера.
Запись автоматически не повторяется. Пустой файл успешно скачивается с размером 0.
