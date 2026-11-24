# Identity and access

Use `kaiten_workspace_read` to inspect the token account, users and access. Write through `kaiten_workspace_write`. Start with `get_current_user`, `list_company_users` or `list_space_users`. Use `list_tree_roles` to resolve role UIDs for invitations and grants. See also [SCIM provisioning](./scim.md).

| Area                  | Operations                                                                                          | Arguments                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Company access        | `list_company_users`, `update_company_user_access`, `delete_virtual_user`                           | `query?` for list; `user_id`, `apps_permissions?`, `temporarily_inactive?` for update; `user_id` for removal                                               |
| Account and directory | `get_current_user`, `list_directory_users`, `scan_directory_users`, `update_user_profile`           | No arguments for current user; `query?` for list/iterate; `max_items?` for iterate; `user_id`, `body` for update                                           |
| Groups                | `create_group`, `get_group`, `list_groups`, `update_group`, `delete_group`                          | `name`, `permissions?`, `add_to_cards_and_spaces_enabled?` for create; `uid` for get/update/delete; optional creation fields for update; `query?` for list |
| Group admins          | `add_group_admin`, `list_group_admins`, `remove_group_admin`                                        | `group_uid`; `user_id` for add/remove                                                                                                                      |
| Group members         | `add_group_member`, `list_group_members`, `remove_group_member`                                     | `group_uid`; `user_id` for add/remove; `request_id?`, `operator_comment?` for add                                                                          |
| Group grants          | `grant_group_access`, `list_group_access`, `update_group_access`, `revoke_group_access`             | `group_uid`; `entity_uid`, `role_ids` for add; `uid`, `role_ids` for update; `uid` for delete                                                              |
| Company roles         | `create_user_role`, `list_user_roles`, `get_user_role`, `update_user_role`, `delete_user_role`      | `name` for create; `role_id` for get/update/delete; `name` for update; `replace_role_id` for delete                                                        |
| Space access          | `invite_space_user`, `list_space_users`, `get_space_user`, `update_space_user`, `remove_space_user` | `space_id`; `body` for invite/change; `id` for get/change/remove; `query?` for list                                                                        |
| Workspace tree        | `list_tree_entities`                                                                                | `query?`: `parent_entity_uid`, `levels_count`, `limit`, `offset`                                                                                           |
| Tree roles            | `list_tree_roles`                                                                                   | No arguments                                                                                                                                               |

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

`scan_directory_users` returns a bounded `{result: {items, truncated}}` snapshot (default
100, maximum 1,000). It keeps all query filters, advances offsets by the number
actually received, and continues through short pages until an empty page or
the bound. It may read one lookahead item to determine truncation and does not
return a continuation token. Use `list_directory_users` for individual
offset pages. Space user lists instead use `last_user_id` pagination.

Upstream marks group and tree-access APIs as beta. Its current group-list
contract warns that `with_tree_entities: true` is rejected; list group entities
with `list_group_access` instead.

Invite a space user without sending email through canonical `kaiten_workspace_write`.

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
