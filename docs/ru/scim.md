# Подготовка пользователей через SCIM

SCIM использует публичный `KaitenScimClient`, настроенный origin компании и
`KAITEN_TOKEN`. Чтение выполняется через `kaiten_navigation_read`, создание и
patch — через `kaiten_navigation_write`. Сервер по-прежнему предоставляет
18 инструментов.

Вызовы используют [формат расширенных операций](./api.md). Аргументы верхнего
уровня записываются в `snake_case`; вложенные SCIM-данные и ответы сохраняют
исходный регистр: `userName`, `givenName`, `displayName`, `Operations`,
`Resources`, `totalResults`. Полный ответ клиента находится внутри `{result}`.
Ошибки доступа используют тот же безопасный формат HTTP-статусов, что и REST.

| Операция                  | Аргументы                                         | Поведение                                                                      |
| ------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| `scim.users.addUser`      | `body`: `emails`, `userName?`, `name?`            | Создание пользователя; `emails` соответствует JSON-словарю в контракте клиента |
| `scim.users.getUser`      | `user_id`                                         | Чтение пользователя с метаданными SCIM                                         |
| `scim.users.getUsers`     | `start_index?`, `count?`, `filter?`               | Одна страница с `Resources` и метаданными пагинации                            |
| `scim.users.updateUser`   | `user_id`, `operations`                           | Изменение активности или имени                                                 |
| `scim.users.iterate`      | `start_index?`, `count?`, `filter?`, `max_items?` | Ограниченный снимок через итератор клиента                                     |
| `scim.groups.addGroup`    | `display_name`                                    | Создание группы                                                                |
| `scim.groups.getGroup`    | `group_id` (строка или числовой ID)               | Чтение группы                                                                  |
| `scim.groups.getGroups`   | `start_index?`, `count?`                          | Страница групп                                                                 |
| `scim.groups.updateGroup` | `group_id`, `operations`                          | Изменение названия или участников                                              |
| `scim.groups.iterate`     | `start_index?`, `count?`, `max_items?`            | Ограниченный снимок групп                                                      |

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

Деактивация пользователя через `kaiten_navigation_write`:

```json
{
  "request": {
    "operation": "scim.users.updateUser",
    "args": {
      "user_id": 5,
      "operations": [{"op": "replace", "path": "active", "value": false}]
    }
  }
}
```
