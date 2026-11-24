import * as z from 'zod/v4';
import type {CatalogRoute} from '../../catalog.ts';
import {snapshotResult} from './snapshot-result.ts';

const userId =
  'Numeric Kaiten user ID from get_current_user or list_company_users.';
const groupUid =
  'Kaiten group UID from list_groups. Use its UID, rather than its numeric ID.';
const spaceId = 'Numeric ID from list_spaces.';
const treeRole =
  'Tree access role UID from list_tree_roles, distinct from a numeric time-tracking role ID.';
const userRole =
  'Numeric user role ID from list_user_roles. The built-in Employee role has ID -1.';
const pageQuery = {
  'query.limit': 'Maximum requested results in one upstream page.',
  'query.offset':
    'Zero-based row offset. Keep filters and advance by the received row count.',
};
const directoryQuery = {
  ...pageQuery,
  'query.type': 'Native Kaiten user type filter.',
  'query.query': 'Text to match against directory users.',
  'query.ids':
    'Only include these numeric user IDs, as an array or comma-separated string.',
  'query.include_inactive': 'Include inactive accounts when true.',
  'query.exclude_members_by_entity_uid':
    'Exclude members of this tree entity, including inherited access.',
  'query.exclude_directly_added_members_by_entity_uid':
    'Exclude directly added members of this tree entity.',
};

export const accessReads = {
  get_current_user: [
    {
      source: 'get_current_user',
      description:
        'Resolve the authenticated user before handling personal requests. Use item.id for the current user’s card filters.',
    },
    {
      source: 'users.retrieveCurrentUser',
      description:
        'Read the connected account’s complete Kaiten user record when profile metadata is needed.',
      input: source =>
        source.safeExtend({
          format: z
            .literal('native')
            .describe('Return the full profile under result.'),
        }),
      mapArgs: () => ({}),
    },
  ],
  list_company_users: [
    {
      source: 'list_users',
      description:
        'Find users for card ownership or membership. Returns compact identities and next_offset.',
      fields: {
        query: 'Text to look up in the Kaiten company directory.',
        limit: 'Maximum users in this page.',
        offset: 'Use the previous next_offset with the same search text.',
      },
    },
    {
      source: 'companyUsers.getListOfUsers',
      description:
        'Inspect company user access, licences and membership metadata. Supply format native for the full upstream filter set.',
      input: source =>
        source.safeExtend({
          format: z
            .literal('native')
            .describe(
              'Enable company-access filters and return the full result.',
            ),
        }),
      mapArgs: ({query}) => ({query}),
      fields: {
        ...pageQuery,
        'query.query': 'Text search in the company user list.',
        'query.invitesOnly': 'Select pending invitations.',
        'query.withTransferAccessStatus': 'Include access transfer status.',
        'query.for_members_section': 'Use Kaiten’s company members filter.',
        'query.owner_only': 'Limit results to company owners.',
        'query.only_paid': 'Limit results to paid users.',
        'query.only_records_count':
          'Return only a count when paired with for_members_section or only_virtual.',
        'query.only_virtual': 'Limit results to virtual users.',
        'query.group_ids': 'Filter by Kaiten group identifiers.',
        'query.permissions': 'Filter by native company permission values.',
        'query.take_licence': 'Native licence usage filter.',
        'query.temporarily_inactive_status':
          'Native temporary inactivity filter.',
      },
    },
  ],
  list_directory_users: {
    source: 'users.retrieveListOfUsers',
    description:
      'Read one directory page by user IDs, status or tree membership exclusions. Use list_company_users for company licence and invitation filters.',
    fields: directoryQuery,
  },
  scan_directory_users: {
    source: 'users.iterate',
    description:
      'Collect directory users across offset pages up to max_items. For resumable reads use list_directory_users because this snapshot returns no continuation index.',
    fields: {
      ...directoryQuery,
      max_items:
        'Maximum collected entries. A lookahead read determines truncated.',
    },
    output: snapshotResult,
  },
  list_groups: {
    source: 'groups.getListOfGroups',
    description:
      'Find Kaiten groups, optionally with user counts or directory sync metadata. Get entity access via list_group_access; Kaiten rejects with_tree_entities=true.',
    fields: {
      ...pageQuery,
      'query.query': 'Search group names by text.',
      'query.condition': 'Filter by native group lifecycle condition.',
      'query.with_users_count': 'Include group user counts.',
      'query.with_sync_group_attribute':
        'Include the provisioning sync attribute.',
      'query.with_tree_entities':
        'Reserved by Kaiten. Keep false or omit, then read entity grants separately.',
    },
  },
  get_group: {
    source: 'groups.getGroup',
    description:
      'Inspect settings for a known Kaiten group UID, including company permission assignments.',
    fields: {uid: groupUid},
  },
  list_group_admins: {
    source: 'groupAdmins.getListOfGroupAdmins',
    description:
      'Identify administrators of an existing Kaiten group. Use list_group_members for ordinary membership.',
    fields: {group_uid: groupUid},
  },
  list_group_members: {
    source: 'groupUsers.getListOfGroupUsers',
    description:
      'Identify users who belong to a Kaiten group before changing its membership.',
    fields: {group_uid: groupUid},
  },
  list_group_access: {
    source: 'groupEntities.getListOfGroupEntities',
    description:
      'Read an existing group’s grants on workspace tree entities. Use returned entity UIDs when updating access.',
    fields: {group_uid: groupUid},
  },
  list_space_users: {
    source: 'spaceUsers.getListOfUsers',
    description:
      'Inspect users with access to one space. Pass the previous page’s last user ID to resume. Include inherited access when investigating effective membership.',
    fields: {
      space_id: spaceId,
      'query.include_inherited_access':
        'Include users granted access through a parent entity.',
      'query.inactive': 'Filter by user inactivity.',
      'query.limit': 'Maximum users requested.',
      'query.last_user_id':
        'Continue after the last user from the previous page, retaining the same filters.',
    },
  },
  get_space_user: {
    source: 'spaceUsers.getUser',
    description:
      'Inspect a known user’s access and notification settings within one space.',
    fields: {space_id: spaceId, id: userId},
  },
  list_tree_entities: {
    source: 'treeEntities.getListOfEntities',
    description:
      'Discover workspace tree targets for group access grants and space placement. A parent UID and levels_count select a subtree.',
    fields: {
      ...pageQuery,
      'query.parent_entity_uid':
        'Tree UID to use as the root of the requested subtree.',
      'query.levels_count': 'Number of hierarchy levels to include.',
    },
  },
  list_tree_roles: {
    source: 'treeEntityRoles.getListOfTreeEntityRoles',
    description:
      'Find role UIDs for space invitations and tree entity access grants. Use list_user_roles for numeric time-tracking user role IDs.',
  },
  list_user_roles: {
    source: 'userRoles.getListOfUserRoles',
    description:
      'Find numeric user role IDs for time logging or role administration. Choose list_tree_roles for workspace permissions.',
  },
  get_user_role: {
    source: 'userRoles.getUserRole',
    description: 'Inspect the name and UID of a known numeric user role.',
    fields: {role_id: userRole},
  },
} satisfies Record<string, CatalogRoute | readonly CatalogRoute[]>;

const groupOptions = {
  permissions: 'Native company permissions bitmask assigned to the group.',
  add_to_cards_and_spaces_enabled:
    'Allow the group to be added to cards and spaces.',
};
const grantFields = {
  group_uid: groupUid,
  role_ids:
    'Tree role UIDs to assign to the group on this entity. An empty array clears the assigned roles.',
};

export const accessWrites = {
  update_company_user_access: {
    source: 'companyUsers.updateUser',
    description:
      'Change a user’s company app permissions or temporary activation. This affects company access. For space-only changes use update_space_user.',
    fields: {
      user_id: userId,
      apps_permissions:
        'Native company app permissions bitmask. Zero removes the current grants in this mask.',
      temporarily_inactive:
        'True to temporarily deactivate the user, false to reactivate.',
    },
  },
  delete_virtual_user: {
    source: 'companyUsers.removeVirtualUser',
    description:
      'Delete a virtual company user. Verify the account using list_company_users with only_virtual before deleting.',
    fields: {user_id: userId},
  },
  update_user_profile: {
    source: 'users.updateUser',
    description:
      'Patch a user’s profile, password or personal preferences. Password changes modify credentials; use only with an explicitly requested credential update.',
    fields: {
      user_id: userId,
      'body.old_password':
        'Existing password for a password change when required. Supply at least one actual change.',
      'body.password': 'Replacement password. This value is sensitive.',
      'body.lng': 'Kaiten locale code for the user interface.',
      'body.timezone': 'User timezone for display and notifications.',
      'body.default_space_id':
        'Numeric space ID to open by default. Null clears the preference.',
      'body.notification_enabled_channels':
        'Delivery channels to enable for this user.',
    },
  },
  create_group: {
    source: 'groups.createGroup',
    description:
      'Create a Kaiten company group. Use add_group_member to populate it and grant_group_access to assign workspace access.',
    fields: groupOptions,
  },
  update_group: {
    source: 'groups.updateGroup',
    description:
      'Change a Kaiten company group’s name or permission settings. Permission changes affect group members.',
    fields: {uid: groupUid, ...groupOptions},
  },
  delete_group: {
    source: 'groups.removeGroup',
    description:
      'Remove a Kaiten company group and its access path. Inspect list_group_members and list_group_access before removing a group.',
    fields: {uid: groupUid},
  },
  add_group_admin: {
    source: 'groupAdmins.addAdminToGroup',
    description:
      'Assign group administration to a user. Use add_group_member for ordinary membership.',
    fields: {group_uid: groupUid, user_id: userId},
  },
  remove_group_admin: {
    source: 'groupAdmins.removeAdminFromGroup',
    description:
      'Remove a user’s group administrator assignment. Use list_group_admins to confirm the target.',
    fields: {group_uid: groupUid, user_id: userId},
  },
  add_group_member: {
    source: 'groupUsers.addUserToGroup',
    description:
      'Add a user to a company group. The user may inherit permissions and entity access granted to the group.',
    fields: {
      group_uid: groupUid,
      user_id: userId,
      request_id: 'Optional originating request UID for the membership change.',
      operator_comment: 'Optional reason attached to the operation.',
    },
  },
  remove_group_member: {
    source: 'groupUsers.removeUserFromGroup',
    description:
      'Remove a user’s group membership and the access they inherit from it. Other access grants may still apply.',
    fields: {group_uid: groupUid, user_id: userId},
  },
  grant_group_access: {
    source: 'groupEntities.addEntity',
    description:
      'Grant a company group roles on a workspace tree entity. Inspect list_tree_roles and list_tree_entities before assigning permissions.',
    fields: {
      ...grantFields,
      entity_uid: 'Target tree entity UID from list_tree_entities.',
    },
  },
  update_group_access: {
    source: 'groupEntities.updateGroupEntity',
    description:
      'Replace a group’s roles on an already linked entity. This can change effective access for all members.',
    fields: {...grantFields, uid: 'Entity UID from list_group_access.'},
  },
  revoke_group_access: {
    source: 'groupEntities.removeEntity',
    description:
      'Revoke the group’s association with one tree entity while keeping the group and entity.',
    fields: {group_uid: groupUid, uid: 'Entity UID from list_group_access.'},
  },
  invite_space_user: {
    source: 'spaceUsers.inviteUserToSpace',
    description:
      'Grant access to a space by email and optionally send an invitation email. Resolve the desired role with list_tree_roles first.',
    fields: {
      space_id: spaceId,
      'body.email': 'Email address of the intended recipient.',
      'body.role_id': treeRole,
      'body.guest': 'Invite with guest access when true.',
      'body.send_email':
        'Set false when granting access without sending an invitation email.',
      'body.operator_comment': 'Reason to attach to the invitation.',
    },
  },
  update_space_user: {
    source: 'spaceUsers.changeUserRoleAndNotificationSettings',
    description:
      'Change a user’s space role or group and optionally update notifications. Supply a role ID or a space group change.',
    fields: {
      space_id: spaceId,
      id: userId,
      'body.role_id': treeRole,
      'body.space_group_id':
        'Numeric space group ID. Null clears the group association.',
      'body.notifications_enabled':
        'Enable or disable space notifications for the user.',
      'body.settings':
        'Native space membership settings accompanying the access update.',
    },
  },
  remove_space_user: {
    source: 'spaceUsers.removeUserFromSpace',
    description:
      'Revoke the user’s direct access to this space. Inherited access may still apply. Recheck with list_space_users.',
    fields: {space_id: spaceId, id: userId},
  },
  create_user_role: {
    source: 'userRoles.createUserRole',
    description:
      'Create a named user role for time tracking. Use tree access roles when granting workspace access.',
    fields: {name: 'Name shown when this role is assigned or selected.'},
  },
  update_user_role: {
    source: 'userRoles.updateUserRole',
    description:
      'Rename an existing user role. Clients continue to refer to it by its numeric ID.',
    fields: {role_id: userRole, name: 'New display name for the role.'},
  },
  delete_user_role: {
    source: 'userRoles.removeUserRole',
    description:
      'Delete a user role and pass the role that should replace it. Resolve both before deletion because the IDs have opposite effects.',
    fields: {
      role_id: 'Numeric ID of the role to delete.',
      replace_role_id:
        'Numeric ID of the role Kaiten should use in place of the deleted role.',
    },
  },
} satisfies Record<string, CatalogRoute>;
