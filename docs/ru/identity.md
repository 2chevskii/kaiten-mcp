# Пользователи и права доступа

См. также [подготовку пользователей через SCIM](./scim.md).
[Аргументы ролей учёта времени](./time-tracking.md) принимают встроенный ID Employee `-1`.

Эти [расширенные операции](./api.md) используют `kaiten_navigation_read` и
`kaiten_navigation_write`; сервер по-прежнему предоставляет 20 инструментов.
Изменения требуют административных прав токена в Kaiten. Ответы сохраняют
полный исходный JSON в `{result}`.

| Ресурс            | Операции после `resource.`                                                                                       | Аргументы                                                                                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `companyUsers`    | `getListOfUsers`, `updateUser`, `removeVirtualUser`                                                              | `query?` для списка; `user_id`, `apps_permissions?`, `temporarily_inactive?` для изменения; `user_id` для удаления                                                            |
| `users`           | `retrieveCurrentUser`, `retrieveListOfUsers`, `iterate`, `updateUser`                                            | Без аргументов для текущего пользователя; `query?` для списка/обхода; `max_items?` для обхода; `user_id`, `body` для изменения                                                |
| `groups`          | `createGroup`, `getGroup`, `getListOfGroups`, `updateGroup`, `removeGroup`                                       | `name`, `permissions?`, `add_to_cards_and_spaces_enabled?` для создания; `uid` для чтения/изменения/удаления; необязательные поля создания для изменения; `query?` для списка |
| `groupAdmins`     | `addAdminToGroup`, `getListOfGroupAdmins`, `removeAdminFromGroup`                                                | `group_uid`; `user_id` для добавления/удаления                                                                                                                                |
| `groupUsers`      | `addUserToGroup`, `getListOfGroupUsers`, `removeUserFromGroup`                                                   | `group_uid`; `user_id` для добавления/удаления; `request_id?`, `operator_comment?` для добавления                                                                             |
| `groupEntities`   | `addEntity`, `getListOfGroupEntities`, `updateGroupEntity`, `removeEntity`                                       | `group_uid`; `entity_uid`, `role_ids` для добавления; `uid`, `role_ids` для изменения; `uid` для удаления                                                                     |
| `userRoles`       | `createUserRole`, `getListOfUserRoles`, `getUserRole`, `updateUserRole`, `removeUserRole`                        | `name` для создания; `role_id` для чтения/изменения/удаления; `name` для изменения; `replace_role_id` для удаления                                                            |
| `spaceUsers`      | `inviteUserToSpace`, `getListOfUsers`, `getUser`, `changeUserRoleAndNotificationSettings`, `removeUserFromSpace` | `space_id`; `body` для приглашения/изменения; `id` для чтения/изменения/удаления; `query?` для списка                                                                         |
| `treeEntities`    | `getListOfEntities`                                                                                              | `query?`: `parent_entity_uid`, `levels_count`, `limit`, `offset`                                                                                                              |
| `treeEntityRoles` | `getListOfTreeEntityRoles`                                                                                       | Без аргументов                                                                                                                                                                |

Фильтры пользователей компании включают приглашения, лицензии, неактивность,
группы и права. Исходные поля query, например `invitesOnly` и
`withTransferAccessStatus`, сохраняют регистр. Массивы query содержат строки,
числа или логические значения согласно HTTP-кодированию клиента.

Изменение пользователя охватывает профиль, учётные данные, язык/часовой пояс,
тему, пространство по умолчанию и настройки/каналы уведомлений.
`old_password` само по себе не считается изменением. Приглашения в пространство
принимают email, роль, гостевой статус, комментарий оператора и флаг отправки
письма. Изменение доступа требует `role_id` или `space_group_id`; вместе с ними
можно передать уведомления и настройки. `space_group_id: null` очищает связь с
группой. `role_ids: []` у сущности группы очищает назначенные роли.

`users.iterate` возвращает ограниченный снимок `{result: {items, truncated}}`
(по умолчанию 100, максимум 1 000). Он сохраняет фильтры, увеличивает offset на
фактическое число полученных элементов и продолжает обход коротких страниц до
пустой страницы или ограничения. Для определения усечения может быть прочитан
один дополнительный элемент; курсор продолжения не возвращается. Для отдельных
страниц используйте `users.retrieveListOfUsers`. Списки участников пространства
используют пагинацию по `last_user_id`.

Upstream помечает API групп и доступа к дереву как beta. Текущий контракт списка
групп предупреждает, что `with_tree_entities: true` отклоняется; для сущностей
группы используйте `groupEntities.getListOfGroupEntities`.

Приглашение участника без отправки письма через `kaiten_navigation_write`:

```json
{
  "request": {
    "operation": "spaceUsers.inviteUserToSpace",
    "args": {
      "space_id": 1,
      "body": {
        "email": "user@example.com",
        "role_id": "role-uid",
        "send_email": false
      }
    }
  }
}
```
