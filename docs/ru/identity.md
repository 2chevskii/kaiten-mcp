# Пользователи и права доступа

Читайте аккаунт токена, пользователей и доступ через `kaiten_workspace_read`, управляйте доступом через `kaiten_workspace_write`. Начните с `get_current_user`, `list_company_users` или `list_space_users`. Для приглашений и выдачи доступа используйте UID ролей из `list_tree_roles`. См. также [SCIM](./scim.md).

| Область                      | Операции                                                                                            | Аргументы                                                                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Доступ к компании            | `list_company_users`, `update_company_user_access`, `delete_virtual_user`                           | `query?` для списка; `user_id`, `apps_permissions?`, `temporarily_inactive?` для изменения; `user_id` для удаления                                                            |
| Аккаунт и пользователи       | `get_current_user`, `list_directory_users`, `scan_directory_users`, `update_user_profile`           | Без аргументов для текущего пользователя; `query?` для списка/обхода; `max_items?` для обхода; `user_id`, `body` для изменения                                                |
| Группы                       | `create_group`, `get_group`, `list_groups`, `update_group`, `delete_group`                          | `name`, `permissions?`, `add_to_cards_and_spaces_enabled?` для создания; `uid` для чтения/изменения/удаления; необязательные поля создания для изменения; `query?` для списка |
| Администраторы групп         | `add_group_admin`, `list_group_admins`, `remove_group_admin`                                        | `group_uid`; `user_id` для добавления/удаления                                                                                                                                |
| Участники групп              | `add_group_member`, `list_group_members`, `remove_group_member`                                     | `group_uid`; `user_id` для добавления/удаления; `request_id?`, `operator_comment?` для добавления                                                                             |
| Доступ групп                 | `grant_group_access`, `list_group_access`, `update_group_access`, `revoke_group_access`             | `group_uid`; `entity_uid`, `role_ids` для добавления; `uid`, `role_ids` для изменения; `uid` для удаления                                                                     |
| Роли компании                | `create_user_role`, `list_user_roles`, `get_user_role`, `update_user_role`, `delete_user_role`      | `name` для создания; `role_id` для чтения/изменения/удаления; `name` для изменения; `replace_role_id` для удаления                                                            |
| Доступ к пространству        | `invite_space_user`, `list_space_users`, `get_space_user`, `update_space_user`, `remove_space_user` | `space_id`; `body` для приглашения/изменения; `id` для чтения/изменения/удаления; `query?` для списка                                                                         |
| Дерево рабочего пространства | `list_tree_entities`                                                                                | `query?`: `parent_entity_uid`, `levels_count`, `limit`, `offset`                                                                                                              |
| Роли дерева                  | `list_tree_roles`                                                                                   | Без аргументов                                                                                                                                                                |

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

`scan_directory_users` возвращает ограниченный снимок `{result: {items, truncated}}`
(по умолчанию 100, максимум 1 000). Он сохраняет фильтры, увеличивает offset на
фактическое число полученных элементов и продолжает обход коротких страниц до
пустой страницы или ограничения. Для определения усечения может быть прочитан
один дополнительный элемент; курсор продолжения не возвращается. Для отдельных
страниц используйте `list_directory_users`. Списки участников пространства
используют пагинацию по `last_user_id`.

Upstream помечает API групп и доступа к дереву как beta. Текущий контракт списка
групп предупреждает, что `with_tree_entities: true` отклоняется; для сущностей
группы используйте `list_group_access`.

Приглашение участника без отправки письма через `kaiten_workspace_write`:

```json
{
  "request": {
    "operation": "invite_space_user",
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
