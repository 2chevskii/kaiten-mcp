# Identity and access

See also [SCIM provisioning](./scim.md).
Time-tracking [role inputs](./time-tracking.md) accept the built-in Employee ID `-1`.

These [advanced operations](./api.md) share `kaiten_navigation_read` and
`kaiten_navigation_write`; the server still exposes 16 tools. Mutations use the
configured token's Kaiten administrative permissions. Responses preserve the
complete upstream JSON in `{result}`.

| Resource          | Operations after `resource.`                                                                                     | Arguments                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `companyUsers`    | `getListOfUsers`, `updateUser`, `removeVirtualUser`                                                              | `query?` for list; `user_id`, `apps_permissions?`, `temporarily_inactive?` for update; `user_id` for removal                                               |
| `users`           | `retrieveCurrentUser`, `retrieveListOfUsers`, `iterate`, `updateUser`                                            | No arguments for current user; `query?` for list/iterate; `max_items?` for iterate; `user_id`, `body` for update                                           |
| `groups`          | `createGroup`, `getGroup`, `getListOfGroups`, `updateGroup`, `removeGroup`                                       | `name`, `permissions?`, `add_to_cards_and_spaces_enabled?` for create; `uid` for get/update/delete; optional creation fields for update; `query?` for list |
| `groupAdmins`     | `addAdminToGroup`, `getListOfGroupAdmins`, `removeAdminFromGroup`                                                | `group_uid`; `user_id` for add/remove                                                                                                                      |
| `groupUsers`      | `addUserToGroup`, `getListOfGroupUsers`, `removeUserFromGroup`                                                   | `group_uid`; `user_id` for add/remove; `request_id?`, `operator_comment?` for add                                                                          |
| `groupEntities`   | `addEntity`, `getListOfGroupEntities`, `updateGroupEntity`, `removeEntity`                                       | `group_uid`; `entity_uid`, `role_ids` for add; `uid`, `role_ids` for update; `uid` for delete                                                              |
| `userRoles`       | `createUserRole`, `getListOfUserRoles`, `getUserRole`, `updateUserRole`, `removeUserRole`                        | `name` for create; `role_id` for get/update/delete; `name` for update; `replace_role_id` for delete                                                        |
| `spaceUsers`      | `inviteUserToSpace`, `getListOfUsers`, `getUser`, `changeUserRoleAndNotificationSettings`, `removeUserFromSpace` | `space_id`; `body` for invite/change; `id` for get/change/remove; `query?` for list                                                                        |
| `treeEntities`    | `getListOfEntities`                                                                                              | `query?`: `parent_entity_uid`, `levels_count`, `limit`, `offset`                                                                                           |
| `treeEntityRoles` | `getListOfTreeEntityRoles`                                                                                       | No arguments                                                                                                                                               |

The company-user query includes invitation, licence, inactivity, group and
permission filters. Native query fields such as `invitesOnly` and
`withTransferAccessStatus` keep their casing. Query arrays contain strings,
numbers or booleans, matching the client's HTTP encoding.

User updates cover profile, credentials, locale/timezone, theme, default space
and notification settings/channels. `old_password` alone is not a change.
Space invitations accept email, role, guest status, operator comment and the
email-delivery flag. Space access updates require `role_id` or `space_group_id`;
notification/settings fields may accompany that change. `space_group_id: null`
clears the group association. Group entity `role_ids: []` clears assigned roles.

`users.iterate` returns a bounded `{result: {items, truncated}}` snapshot (default
100, maximum 1,000). It keeps all query filters, advances offsets by the number
actually received, and continues through short pages until an empty page or
the bound. It may read one lookahead item to determine truncation and does not
return a continuation token. Use `users.retrieveListOfUsers` for individual
offset pages. Space user lists instead use `last_user_id` pagination.

Upstream marks group and tree-access APIs as beta. Its current group-list
contract warns that `with_tree_entities: true` is rejected; list group entities
with `groupEntities.getListOfGroupEntities` instead.

Invite a space user without sending email, via `kaiten_navigation_write`:

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
