import * as z from 'zod/v4';
import type {CatalogRoute} from '../../catalog.ts';
import {snapshotResult} from './snapshot-result.ts';

const provisionPage = {
  start_index:
    'One-based SCIM start index. Advance by the number of Resources actually returned.',
  count: 'Requested SCIM page size. Zero requests a count without resources.',
};
const scimFilter =
  'SCIM filter expression, for example userName eq "user@example.com".';
const batchLimit =
  'Maximum entries to collect across pages. Defaults to 100, with a maximum of 1000.';
const scimGroup =
  'SCIM resource ID from list_scim_groups. May be a string or a number.';
const scimUser = 'Numeric SCIM user resource ID from list_scim_users.';
const activityFields = {
  'query.cursor':
    'Opaque next_cursor from the previous page. Replay it unchanged with the same filters.',
  'query.limit': 'Maximum activity events per upstream page.',
  'query.actions': 'Comma-separated event action names.',
  'query.author_id': 'Numeric ID of the user who performed the action.',
  'query.created_after':
    'Start of the event creation time range in Kaiten date or timestamp syntax.',
  'query.created_before':
    'End of the event creation time range in Kaiten date or timestamp syntax.',
};
const companyActivityFields = {
  ...activityFields,
  'query.card_id':
    'Numeric card ID for company-wide activity about a specific card.',
};
const spaceActivityFields = {
  ...activityFields,
  space_id:
    'Numeric space ID from list_spaces. Omit space_id for the company feed.',
};
const activityPage = {
  output: (source: z.ZodObject) =>
    source.safeExtend({
      result: z.looseObject({
        items: z
          .array(z.json())
          .describe('Activity events with native details.'),
        limit: z.number().describe('Upstream page size.'),
        next_cursor: z
          .string()
          .nullable()
          .describe(
            'Opaque continuation cursor. Null indicates the feed has ended.',
          ),
      }),
    }),
};
const addonOutput = {
  output: (source: z.ZodObject) =>
    source.safeExtend({
      result: z
        .json()
        .describe(
          'Token availability and, when available, the sensitive access_token and its expiration.',
        ),
    }),
};
const addonKey = {
  addon_uid: 'UID of the installed Kaiten add-on.',
  user_id: 'Numeric Kaiten user ID for the token owner.',
  company_id: 'Numeric company ID under which the add-on is installed.',
};

export const provisioningReads = {
  list_scim_users: {
    source: 'scim.users.getUsers',
    description:
      'Read one user page from the SCIM provisioning API. Use list_company_users to look up Kaiten users for card assignments.',
    fields: {...provisionPage, filter: scimFilter},
  },
  scan_scim_users: {
    source: 'scim.users.iterate',
    description:
      'Collect a bounded user provisioning snapshot across SCIM pages. Use list_scim_users for resumable reads with SCIM paging metadata.',
    fields: {...provisionPage, filter: scimFilter, max_items: batchLimit},
    output: snapshotResult,
  },
  get_scim_user: {
    source: 'scim.users.getUser',
    description:
      'Read a SCIM provisioning user resource by ID, including provisioning metadata.',
    fields: {user_id: scimUser},
  },
  list_scim_groups: {
    source: 'scim.groups.getGroups',
    description:
      'Read one group page from the SCIM provisioning API. Use list_groups to inspect native Kaiten company groups and grants.',
    fields: provisionPage,
  },
  scan_scim_groups: {
    source: 'scim.groups.iterate',
    description:
      'Collect a bounded SCIM group snapshot. Use list_scim_groups to continue from a known page index.',
    fields: {...provisionPage, max_items: batchLimit},
    output: snapshotResult,
  },
  get_scim_group: {
    source: 'scim.groups.getGroup',
    description: 'Read one SCIM provisioning group resource by ID.',
    fields: {group_id: scimGroup},
  },
  list_audit_events: {
    source: 'auditLogs.retrieveAuditLogEvents',
    description:
      'Read one audit log page for administrative events. Availability depends on the company plan and token permissions. Use list_activity for card and workspace activity.',
    fields: {
      'query.from':
        'Start of the audit event time range in Kaiten date or timestamp syntax.',
      'query.to':
        'End of the audit event time range in Kaiten date or timestamp syntax.',
      'query.author_id': 'Numeric ID of the actor.',
      'query.author_uid':
        'UID of the actor when known instead of a numeric ID.',
      'query.categories': 'Comma-separated native audit category names.',
      'query.actions': 'Comma-separated native audit action names.',
      'query.id': 'Match a specific event ID.',
      'query.limit': 'Maximum requested events for this page.',
      'query.offset':
        'Zero-based event offset. Advance by the rows received with filters unchanged.',
    },
    output: source =>
      source.safeExtend({
        result: z
          .array(z.json())
          .describe(
            'Audit events from one upstream page with complete event details.',
          ),
      }),
  },
  list_activity: [
    {
      source: 'activity.listCompanyActivity',
      description:
        'Read the company activity page, optionally narrowed to one card. Omit space_id for company scope. Access depends on company plan and token permissions.',
      fields: companyActivityFields,
      ...activityPage,
    },
    {
      source: 'activity.listSpaceActivity',
      description:
        'Read activity in a single space. Use query.cursor to resume with the same space and filters.',
      fields: spaceActivityFields,
      ...activityPage,
    },
  ],
  scan_activity: [
    {
      source: 'activity.iterateCompanyActivity',
      description:
        'Collect matching company activity across pages up to max_items. Use list_activity if you need a continuation cursor.',
      fields: {...companyActivityFields, max_items: batchLimit},
      output: snapshotResult,
    },
    {
      source: 'activity.iterateSpaceActivity',
      description:
        'Collect matching activity in one space up to max_items. The request timeout covers the entire traversal, including a lookahead for truncated.',
      fields: {...spaceActivityFields, max_items: batchLimit},
      output: snapshotResult,
    },
  ],
  get_addon_token: {
    source: 'addonOAuth.getToken',
    description:
      'Read an installed add-on’s user OAuth token. Requires KAITEN_ADDON_SECRET or KAITEN_ADDON_SECRET_FILE. Treat access_token and the tool result as credentials. Use refresh_addon_token only when a refresh is required.',
    fields: addonKey,
    ...addonOutput,
  },
} satisfies Record<string, CatalogRoute | readonly CatalogRoute[]>;

export const provisioningWrites = {
  provision_scim_user: {
    source: 'scim.users.addUser',
    description:
      'Create a user in the SCIM provisioning directory. Use invite_space_user to invite an existing person to one Kaiten space.',
    fields: {
      'body.emails':
        'Native SCIM email map accepted by the Kaiten provisioning API.',
      'body.userName': 'SCIM login identifier.',
      'body.name.givenName': 'Given name to provision.',
      'body.name.familyName': 'Family name to provision.',
    },
  },
  update_scim_user: {
    source: 'scim.users.updateUser',
    description:
      'Patch an existing SCIM identity. Changing active can deactivate the user’s provisioned account, and removing a name path clears that name value.',
    fields: {
      user_id: scimUser,
      operations:
        'SCIM patches in request order. Replace active with a boolean, or add, replace, or remove supported name fields according to the branch schema.',
    },
  },
  provision_scim_group: {
    source: 'scim.groups.addGroup',
    description:
      'Create a SCIM provisioning group. Use create_group for Kaiten-native group administration.',
    fields: {display_name: 'SCIM displayName for the new group.'},
  },
  update_scim_group: {
    source: 'scim.groups.updateGroup',
    description:
      'Patch a SCIM group’s display name or membership. Removing a member revokes group membership and can change access inherited through the group.',
    fields: {
      group_id: scimGroup,
      operations:
        'SCIM patches in request order. Add or remove a numeric member ID, or add or replace the displayName string.',
    },
  },
  refresh_addon_token: {
    source: 'addonOAuth.refreshToken',
    description:
      'Refresh a user’s add-on OAuth token with the server-configured add-on secret. This changes credentials and returns a sensitive access_token if available. Read get_addon_token when the current token is needed.',
    fields: addonKey,
    ...addonOutput,
  },
} satisfies Record<string, CatalogRoute>;
