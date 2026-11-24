# Подготовка пользователей через SCIM

Используйте `kaiten_workspace_read` для поиска и чтения SCIM, `kaiten_workspace_write` для создания и изменений. Внешние параметры используют `snake_case`, вложенные поля SCIM сохраняют исходные имена, например `userName`, `givenName` и `displayName`. Полный ответ API находится в `{result}`.

| Операция               | Аргументы                                         | Поведение                                                                      |
| ---------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| `provision_scim_user`  | `body`: `emails`, `userName?`, `name?`            | Создание пользователя; `emails` соответствует JSON-словарю в контракте клиента |
| `get_scim_user`        | `user_id`                                         | Чтение пользователя с метаданными SCIM                                         |
| `list_scim_users`      | `start_index?`, `count?`, `filter?`               | Одна страница с `Resources` и метаданными пагинации                            |
| `update_scim_user`     | `user_id`, `operations`                           | Изменение активности или имени                                                 |
| `scan_scim_users`      | `start_index?`, `count?`, `filter?`, `max_items?` | Ограниченный снимок через итератор клиента                                     |
| `provision_scim_group` | `display_name`                                    | Создание группы                                                                |
| `get_scim_group`       | `group_id` (строка или числовой ID)               | Чтение группы                                                                  |
| `list_scim_groups`     | `start_index?`, `count?`                          | Страница групп                                                                 |
| `update_scim_group`    | `group_id`, `operations`                          | Изменение названия или участников                                              |
| `scan_scim_groups`     | `start_index?`, `count?`, `max_items?`            | Ограниченный снимок групп                                                      |

`start_index` — положительное безопасное целое, соответствующее `startIndex`
SCIM с нумерацией от 1; `count` — неотрицательное безопасное целое. Итераторы
клиента по умолчанию начинают с 1 и увеличивают индекс на фактическое число
полученных ресурсов, сохраняя `count` и фильтр пользователей. Они завершаются
при достижении `totalResults` или пустой страницы, не используя `startIndex`
ответа для перехода. Результат `{result: {items, truncated}}` ограничен 100
элементами по умолчанию (1–1 000). Для определения усечения может быть прочитан
один дополнительный элемент. Снимок не содержит курсора; для явной пагинации
используйте операции чтения одной страницы.

Patch пользователя принимает `replace active` с логическим значением;
`add`/`replace name` с частичным `{givenName, familyName}`;
`add`/`replace name.givenName` или `name.familyName` со строкой; и `remove`
для этих путей имени без значения. Patch группы принимает `add`/`remove members`
с числовым ID пользователя и `add`/`replace displayName` со строкой. Клиент
формирует обёртку `Operations` с заглавной буквой. Подготовка групп помечена
upstream как beta.

Деактивация пользователя через `kaiten_workspace_write`:

```json
{
  "request": {
    "operation": "update_scim_user",
    "args": {
      "user_id": 5,
      "operations": [{"op": "replace", "path": "active", "value": false}]
    }
  }
}
```
