import * as z from 'zod/v4';
import {id, pageFields, text, userRoleId} from '../schemas.ts';
import {read, change, type ToolRegistry} from '../tool-registry.ts';
import {apiResult, collectItems} from '../results.ts';

export function registerIdentityAndAccess(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'companyUsers.getListOfUsers',
    'Get list of users (companyUsers); full API fields and JSON response.',
    z.strictObject({
      query: z
        .strictObject({
          invitesOnly: z.boolean().optional(),
          withTransferAccessStatus: z.boolean().optional(),
          for_members_section: z.boolean().optional(),
          owner_only: z.boolean().optional(),
          only_paid: z.boolean().optional(),
          only_records_count: z.boolean().optional(),
          only_virtual: z.boolean().optional(),
          offset: pageFields.offset.removeDefault().optional(),
          limit: pageFields.limit.removeDefault().optional(),
          query: z.string().optional(),
          access_type_permissions: z.string().optional(),
          sd_access_type: z.string().optional(),
          take_licence: z.string().optional(),
          temporarily_inactive_status: z.string().optional(),
          group_ids: z
            .array(z.union([z.string(), z.number(), z.boolean()]))
            .optional(),
          permissions: z
            .array(z.union([z.string(), z.number(), z.boolean()]))
            .optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.companyUsers.getListOfUsers(
        args.query as Parameters<typeof client.companyUsers.getListOfUsers>[0],
        options,
      ),
    }),
  );
  registry.add(
    'companyUsers.removeVirtualUser',
    'Remove virtual user (companyUsers); full API fields and JSON response.',
    z.strictObject({user_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.companyUsers.removeVirtualUser(
        args.user_id,
        options,
      ),
    }),
  );
  registry.add(
    'companyUsers.updateUser',
    'Update user (companyUsers); full API fields and JSON response.',
    z.strictObject({
      user_id: id,
      apps_permissions: z.number().optional(),
      temporarily_inactive: z.boolean().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.companyUsers.updateUser(
        args.user_id,
        args.apps_permissions,
        args.temporarily_inactive,
        options,
      ),
    }),
  );
  registry.add(
    'groupAdmins.addAdminToGroup',
    'Add admin to group (groupAdmins); full API fields and JSON response.',
    z.strictObject({group_uid: text, user_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.groupAdmins.addAdminToGroup(
        args.group_uid,
        args.user_id,
        options,
      ),
    }),
  );
  registry.add(
    'groupAdmins.getListOfGroupAdmins',
    'Get list of group admins (groupAdmins); full API fields and JSON response.',
    z.strictObject({group_uid: text}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.groupAdmins.getListOfGroupAdmins(
        args.group_uid,
        options,
      ),
    }),
  );
  registry.add(
    'groupAdmins.removeAdminFromGroup',
    'Remove admin from group (groupAdmins); full API fields and JSON response.',
    z.strictObject({group_uid: text, user_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.groupAdmins.removeAdminFromGroup(
        args.group_uid,
        args.user_id,
        options,
      ),
    }),
  );
  registry.add(
    'groupEntities.addEntity',
    'Add entity (groupEntities); full API fields and JSON response.',
    z.strictObject({
      group_uid: text,
      entity_uid: text,
      role_ids: z.array(text),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.groupEntities.addEntity(
        args.group_uid,
        args.entity_uid,
        args.role_ids,
        options,
      ),
    }),
  );
  registry.add(
    'groupEntities.getListOfGroupEntities',
    'Get list of group entities (groupEntities); full API fields and JSON response.',
    z.strictObject({group_uid: text}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.groupEntities.getListOfGroupEntities(
        args.group_uid,
        options,
      ),
    }),
  );
  registry.add(
    'groupEntities.removeEntity',
    'Remove entity (groupEntities); full API fields and JSON response.',
    z.strictObject({group_uid: text, uid: text}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.groupEntities.removeEntity(
        args.group_uid,
        args.uid,
        options,
      ),
    }),
  );
  registry.add(
    'groupEntities.updateGroupEntity',
    'Update group entity (groupEntities); full API fields and JSON response.',
    z.strictObject({group_uid: text, uid: text, role_ids: z.array(text)}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.groupEntities.updateGroupEntity(
        args.group_uid,
        args.uid,
        args.role_ids,
        options,
      ),
    }),
  );
  registry.add(
    'groupUsers.addUserToGroup',
    'Add user to group (groupUsers); full API fields and JSON response.',
    z.strictObject({
      group_uid: text,
      user_id: id,
      request_id: text.optional(),
      operator_comment: z.string().nullable().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.groupUsers.addUserToGroup(
        args.group_uid,
        args.user_id,
        args.request_id,
        args.operator_comment,
        options,
      ),
    }),
  );
  registry.add(
    'groupUsers.getListOfGroupUsers',
    'Get list of group users (groupUsers); full API fields and JSON response.',
    z.strictObject({group_uid: text}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.groupUsers.getListOfGroupUsers(
        args.group_uid,
        options,
      ),
    }),
  );
  registry.add(
    'groupUsers.removeUserFromGroup',
    'Remove user from group (groupUsers); full API fields and JSON response.',
    z.strictObject({group_uid: text, user_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.groupUsers.removeUserFromGroup(
        args.group_uid,
        args.user_id,
        options,
      ),
    }),
  );
  registry.add(
    'groups.createGroup',
    'Create group (groups); full API fields and JSON response.',
    z.strictObject({
      name: z.string(),
      permissions: z.number().optional(),
      add_to_cards_and_spaces_enabled: z.boolean().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.groups.createGroup(
        args.name,
        args.permissions,
        args.add_to_cards_and_spaces_enabled,
        options,
      ),
    }),
  );
  registry.add(
    'groups.getGroup',
    'Get group (groups); full API fields and JSON response.',
    z.strictObject({uid: text}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.groups.getGroup(args.uid, options),
    }),
  );
  registry.add(
    'groups.getListOfGroups',
    'Get list of groups (groups); full API fields and JSON response.',
    z.strictObject({
      query: z
        .strictObject({
          with_tree_entities: z.boolean().optional(),
          with_users_count: z.boolean().optional(),
          with_sync_group_attribute: z.boolean().optional(),
          condition: z.string().optional(),
          query: z.string().optional(),
          limit: pageFields.limit.removeDefault().optional(),
          offset: pageFields.offset.removeDefault().optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.groups.getListOfGroups(
        args.query as Parameters<typeof client.groups.getListOfGroups>[0],
        options,
      ),
    }),
  );
  registry.add(
    'groups.removeGroup',
    'Remove group (groups); full API fields and JSON response.',
    z.strictObject({uid: text}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.groups.removeGroup(args.uid, options),
    }),
  );
  registry.add(
    'groups.updateGroup',
    'Update group (groups); full API fields and JSON response.',
    z.strictObject({
      uid: text,
      name: z.string().optional(),
      permissions: z.number().optional(),
      add_to_cards_and_spaces_enabled: z.boolean().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.groups.updateGroup(
        args.uid,
        args.name,
        args.permissions,
        args.add_to_cards_and_spaces_enabled,
        options,
      ),
    }),
  );
  registry.add(
    'spaceUsers.changeUserRoleAndNotificationSettings',
    'Change user role and notification settings (spaceUsers); full API fields and JSON response.',
    z.strictObject({
      space_id: id,
      id: id,
      body: z
        .strictObject({
          role_id: text.optional(),
          notifications_enabled: z.boolean().optional(),
          space_group_id: id.nullable().optional(),
          settings: z.record(z.string(), z.json()).optional(),
        })
        .refine(
          value =>
            value.role_id !== undefined || value.space_group_id !== undefined,
          'Supply at least one of: role_id, space_group_id.',
        ),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.spaceUsers.changeUserRoleAndNotificationSettings(
        args.space_id,
        args.id,
        args.body as Parameters<
          typeof client.spaceUsers.changeUserRoleAndNotificationSettings
        >[2],
        options,
      ),
    }),
  );
  registry.add(
    'spaceUsers.getListOfUsers',
    'Get list of users (spaceUsers); full API fields and JSON response.',
    z.strictObject({
      space_id: id,
      query: z
        .strictObject({
          include_inherited_access: z.boolean().optional(),
          inactive: z.boolean().optional(),
          limit: pageFields.limit.removeDefault().optional(),
          last_user_id: id.optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.spaceUsers.getListOfUsers(
        args.space_id,
        args.query as Parameters<typeof client.spaceUsers.getListOfUsers>[1],
        options,
      ),
    }),
  );
  registry.add(
    'spaceUsers.getUser',
    'Get user (spaceUsers); full API fields and JSON response.',
    z.strictObject({space_id: id, id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.spaceUsers.getUser(args.space_id, args.id, options),
    }),
  );
  registry.add(
    'spaceUsers.inviteUserToSpace',
    'Invite user to space (spaceUsers); full API fields and JSON response.',
    z.strictObject({
      space_id: id,
      body: z.strictObject({
        email: z.string(),
        role_id: text.optional(),
        guest: z.boolean().optional(),
        operator_comment: z.string().optional(),
        send_email: z.boolean().optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.spaceUsers.inviteUserToSpace(
        args.space_id,
        args.body as Parameters<typeof client.spaceUsers.inviteUserToSpace>[1],
        options,
      ),
    }),
  );
  registry.add(
    'spaceUsers.removeUserFromSpace',
    'Remove user from space (spaceUsers); full API fields and JSON response.',
    z.strictObject({space_id: id, id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.spaceUsers.removeUserFromSpace(
        args.space_id,
        args.id,
        options,
      ),
    }),
  );
  registry.add(
    'treeEntities.getListOfEntities',
    'Get list of entities (treeEntities); full API fields and JSON response.',
    z.strictObject({
      query: z
        .strictObject({
          limit: pageFields.limit.removeDefault().optional(),
          offset: pageFields.offset.removeDefault().optional(),
          parent_entity_uid: text.optional(),
          levels_count: z.number().optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.treeEntities.getListOfEntities(
        args.query as Parameters<
          typeof client.treeEntities.getListOfEntities
        >[0],
        options,
      ),
    }),
  );
  registry.add(
    'treeEntityRoles.getListOfTreeEntityRoles',
    'Get list of tree entity roles (treeEntityRoles); full API fields and JSON response.',
    z.strictObject({}),
    apiResult,
    read,
    async (_args, options) => ({
      result: await client.treeEntityRoles.getListOfTreeEntityRoles(options),
    }),
  );
  registry.add(
    'userRoles.createUserRole',
    'Create user role (userRoles); full API fields and JSON response.',
    z.strictObject({name: z.string()}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.userRoles.createUserRole(args.name, options),
    }),
  );
  registry.add(
    'userRoles.getListOfUserRoles',
    'Get list of user roles (userRoles); full API fields and JSON response.',
    z.strictObject({}),
    apiResult,
    read,
    async (_args, options) => ({
      result: await client.userRoles.getListOfUserRoles(options),
    }),
  );
  registry.add(
    'userRoles.getUserRole',
    'Get user role (userRoles); full API fields and JSON response.',
    z.strictObject({role_id: userRoleId}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.userRoles.getUserRole(args.role_id, options),
    }),
  );
  registry.add(
    'userRoles.removeUserRole',
    'Remove user role (userRoles); full API fields and JSON response.',
    z.strictObject({role_id: userRoleId, replace_role_id: userRoleId}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.userRoles.removeUserRole(
        args.role_id,
        args.replace_role_id,
        options,
      ),
    }),
  );
  registry.add(
    'userRoles.updateUserRole',
    'Update user role (userRoles); full API fields and JSON response.',
    z.strictObject({role_id: userRoleId, name: z.string()}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.userRoles.updateUserRole(
        args.role_id,
        args.name,
        options,
      ),
    }),
  );
  registry.add(
    'users.iterate',
    'Collect a bounded snapshot through the public client iterator; returns items and truncated.',
    z.strictObject({
      query: z
        .strictObject({
          type: z.string().optional(),
          query: z.string().optional(),
          access_type_permissions: z.string().optional(),
          ids: z.union([z.string(), z.array(id)]).optional(),
          limit: pageFields.limit.removeDefault().optional(),
          offset: pageFields.offset.removeDefault().optional(),
          include_inactive: z.boolean().optional(),
          exclude_members_by_entity_uid: text.optional(),
          exclude_directly_added_members_by_entity_uid: text.optional(),
        })
        .optional(),
      max_items: z.number().int().min(1).max(1_000).default(100),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await collectItems(
        client.users.iterate(
          args.query as Parameters<typeof client.users.iterate>[0],
          options,
        ),
        args.max_items,
      ),
    }),
  );
  registry.add(
    'users.retrieveCurrentUser',
    'Retrieve current user (users); full API fields and JSON response.',
    z.strictObject({}),
    apiResult,
    read,
    async (_args, options) => ({
      result: await client.users.retrieveCurrentUser(options),
    }),
  );
  registry.add(
    'users.retrieveListOfUsers',
    'Retrieve list of users (users); full API fields and JSON response.',
    z.strictObject({
      query: z
        .strictObject({
          type: z.string().optional(),
          query: z.string().optional(),
          access_type_permissions: z.string().optional(),
          ids: z.union([z.string(), z.array(id)]).optional(),
          limit: pageFields.limit.removeDefault().optional(),
          offset: pageFields.offset.removeDefault().optional(),
          include_inactive: z.boolean().optional(),
          exclude_members_by_entity_uid: text.optional(),
          exclude_directly_added_members_by_entity_uid: text.optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.users.retrieveListOfUsers(
        args.query as Parameters<typeof client.users.retrieveListOfUsers>[0],
        options,
      ),
    }),
  );
  registry.add(
    'users.updateUser',
    'Update user (users); full API fields and JSON response.',
    z.strictObject({
      user_id: id,
      body: z
        .strictObject({
          username: z.string().optional(),
          full_name: z.string().optional(),
          initials: z.string().optional(),
          avatar_type: z
            .union([z.literal(1), z.literal(2), z.literal(3)])
            .optional(),
          password: z.string().optional(),
          old_password: z.string().nullable().optional(),
          lng: z.string().optional(),
          default_space_id: id.nullable().optional(),
          theme: z
            .union([z.literal('light'), z.literal('dark'), z.literal('auto')])
            .optional(),
          email_frequency: z.union([z.literal(1), z.literal(2)]).optional(),
          timezone: z.string().optional(),
          subject_by: z.union([z.literal(1), z.literal(2)]).optional(),
          email_settings: z.record(z.string(), z.json()).optional(),
          telegram_settings: z.record(z.string(), z.json()).optional(),
          slack_settings: z.record(z.string(), z.json()).optional(),
          notification_enabled_channels: z
            .array(
              z.union([
                z.literal('email'),
                z.literal('inner'),
                z.literal('mobile_app'),
                z.literal('slack'),
                z.literal('telegram'),
              ]),
            )
            .optional(),
          notification_settings: z.record(z.string(), z.json()).optional(),
          ui_version: z.union([z.literal(1), z.literal(2)]).optional(),
        })
        .refine(
          value =>
            value.username !== undefined ||
            value.full_name !== undefined ||
            value.initials !== undefined ||
            value.avatar_type !== undefined ||
            value.password !== undefined ||
            value.lng !== undefined ||
            value.default_space_id !== undefined ||
            value.email_frequency !== undefined ||
            value.timezone !== undefined ||
            value.subject_by !== undefined ||
            value.email_settings !== undefined ||
            value.telegram_settings !== undefined ||
            value.slack_settings !== undefined ||
            value.theme !== undefined ||
            value.notification_enabled_channels !== undefined ||
            value.notification_settings !== undefined ||
            value.ui_version !== undefined,
          'Supply at least one of: username, full_name, initials, avatar_type, password, lng, default_space_id, email_frequency, timezone, subject_by, email_settings, telegram_settings, slack_settings, theme, notification_enabled_channels, notification_settings, ui_version.',
        ),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.users.updateUser(
        args.user_id,
        args.body as Parameters<typeof client.users.updateUser>[1],
        options,
      ),
    }),
  );
}
