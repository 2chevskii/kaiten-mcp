import * as z from 'zod/v4';
import type {CatalogDefinition} from '../catalog.ts';
import {pageFields, text} from '../schemas.ts';

const spaceUid =
  'Space UUID from workspace discovery, distinct from the numeric space_id.';
const iterationId = 'Iteration UUID from list_iterations.';
const cardUid = 'Card UUID, distinct from the numeric card_id.';
const cardId = 'Numeric card ID from card search or details.';
const memberships = z.array(
  z.looseObject({iteration_id: z.string(), card_uid: z.string()}),
);
const spaceId = 'Numeric space ID from workspace discovery.';
const roleId =
  'Role ID from workspace role lookup. Pass -1 for the built-in Employee role.';
const workDate = 'Calendar date in YYYY-MM-DD.';
const automationUid =
  'Automation UID returned by list_automations for the same space.';
const iterationDates = {
  'body.start_date': 'Planned start as ISO 8601; null clears it.',
  'body.finish_date': 'Planned finish as ISO 8601; null clears it.',
};
const timeLogBody = {
  'body.role_id': roleId,
  'body.time_spent': 'Time spent in minutes.',
  'body.for_date': workDate,
  'body.comment':
    'Optional note for this work. An empty string is passed through.',
};

export const workflowsCatalog: CatalogDefinition = {
  workflows_read: {
    description: [
      'Read Kaiten planning, time, service desk, SLA and automation data. Use kaiten_cards_read search_cards to find cards by text, location, assignee or status.',
      '- Planning. Use list_iterations by space UID and list_iteration_memberships with the iteration ID. Use list_card_iteration_history with result.uid from kaiten_cards_read get_card in full format to read one card’s participation. Use legacy sprint lookup for historical numeric sprint IDs.',
      '- Time logs. Use list_card_time_logs for one card’s minute-based records. Pass next_offset with the same card, date, personal filter and page size.',
      '- Timesheets. Use get_timesheet with query.from and query.to in YYYY-MM-DD for reports across dates or cards. Use group_by=0 for individual records, 1 for user groups, or 2 for card groups. Request daily distribution only with user or card grouping. Choose only_general_sum for a grand total. Kaiten shapes the result for the selected report and applies time_precision to the chosen time_unit.',
      '- Service desk and SLA. List services for routing and recipient policy. Read SLA by card_id for rules, calendars and working minutes.',
      '- Automations. List by numeric space_id before editing a rule. Use kaiten_workflows_write for mutations and kaiten_cards_read for full card details.',
    ].join('\n'),
    operations: {
      list_iterations: {
        source: 'iterations.retrieveListOfIterations',
        description:
          'Find iterations in one space. Retain filters and ordering across pages. Use list_iteration_memberships for related cards.',
        input: z.strictObject({
          space_uid: text,
          query: z
            .strictObject({
              status: z.string().optional(),
              order: z.enum(['asc', 'desc']).optional(),
              limit: pageFields.limit.removeDefault().optional(),
              offset: pageFields.offset.removeDefault().optional(),
            })
            .optional(),
        }),
        fields: {
          space_uid: spaceUid,
          query:
            'Optional server-side filters, ordering and offset pagination.',
          'query.status':
            'Comma-separated statuses: planned, active, closed or removed.',
          'query.limit': 'Maximum iterations in this page, 1–100.',
          'query.offset': 'Number of matching iterations to skip.',
          'query.order': 'Sort by creation date: asc (Kaiten default) or desc.',
        },
        outputFields: {result: 'The selected operation’s native Kaiten JSON.'},
      },
      get_iteration: {
        source: 'iterations.getIteration',
        description:
          'Read one iteration, its lifecycle state and the statistics available for it.',
        fields: {space_uid: spaceUid, id: iterationId},
      },
      list_iteration_memberships: {
        source: 'iterations.retrieveCardsInIteration',
        description:
          'Read card membership records for an iteration. Use card details to get full card content.',
        fields: {
          space_uid: spaceUid,
          iteration_id: iterationId,
          status:
            'Filter to active or removed membership records. Omit to return both.',
        },
      },
      list_card_iteration_history: {
        source: 'iterations.getCardIterationsHistory',
        description:
          'Read past and current iteration participation for one card. Get its UID in result.uid from kaiten_cards_read get_card with format=full.',
        fields: {
          card_uid: cardUid,
          with_details: 'Include details of the linked iterations.',
        },
      },
      list_legacy_sprints: {
        source: 'sprints.getSprintsList',
        description:
          'Find historical sprint IDs from the deprecated read-only sprint API. Use iterations for current planning.',
        fields: {
          active:
            'True selects active sprints and false selects inactive sprints.',
          limit: 'Maximum legacy sprint entries in this page, 1–100.',
          offset: 'Number of legacy sprint entries to skip.',
        },
      },
      get_legacy_sprint_summary: {
        source: 'sprints.getSprintSummary',
        description: 'Read the historical report for a numeric sprint ID.',
        fields: {
          id: 'Numeric legacy sprint ID returned by list_legacy_sprints.',
          exclude_deleted_cards:
            'True excludes deleted cards from the summary.',
        },
      },
      list_card_time_logs: {
        source: 'catalog.listCardTimeLogs',
        replaces: ['cardTimeLogs.getTimeLogs'],
        description:
          'Read a server page of time logs for one card. For reports spanning a date range or several cards, use get_timesheet.',
        outputFields: {
          result:
            'Original Kaiten time-log entries, with time_spent measured in minutes.',
          next_offset:
            'Pass as offset on the next page with unchanged filters. Null means the last page was short or empty.',
        },
        fields: {
          card_id: cardId,
          for_date:
            'Filter to this calendar date in YYYY-MM-DD. Omit to read logs across dates.',
          personal:
            'Set true to include only the token user’s logs. False or omission leaves that restriction off.',
          limit: 'Kaiten page size, 1–100. Defaults to 100.',
          offset:
            'Use next_offset from a previous call with the same card, filters and page size. Omit to start at zero.',
        },
      },
      get_timesheet: {
        source: 'timesheet.getList',
        description:
          'Read one native report over the date range. For a subsequent page, advance offset with the filters, selectors and limit unchanged. Kaiten chooses the result shape for the selected report.',
        fields: {
          query:
            'Date range, entity filters, aggregation options and pagination. ID list filters accept arrays of numeric IDs or comma-separated ID strings.',
          'query.from': 'Start of the report range, YYYY-MM-DD.',
          'query.to': 'End of the report range, YYYY-MM-DD.',
          'query.tag_ids': 'Restrict to cards carrying the selected tags.',
          'query.user_ids': 'Restrict to the people who logged the time.',
          'query.group_ids': 'Restrict to the selected groups.',
          'query.space_ids': 'Restrict to the selected spaces.',
          'query.board_ids': 'Restrict to the selected boards.',
          'query.column_ids': 'Restrict to the selected columns.',
          'query.card_ids': 'Restrict to the selected cards.',
          'query.visible_column_ids': 'Apply the native visible-column filter.',
          'query.limit': 'Page size, 1–200. Kaiten defaults to 100.',
          'query.offset': 'Number of matching records to skip.',
          'query.condition':
            'Native timesheet condition selector. The public API leaves its accepted settings unspecified. Omit unless your integration has a verified value.',
          'query.group_by':
            'Use 0 for individual time records, 1 to group by user, or 2 to group by card.',
          'query.time_precision':
            'Precision in the selected time_unit. Use a confirmed native unit/precision pair or leave both at Kaiten defaults.',
          'query.time_unit':
            'Native reporting unit. The public reference lists no numeric unit mapping. Leave omitted for the upstream default.',
          'query.with_daily_distribution':
            'Integer option for per-day values in a grouped report. Use with group_by 1 or 2.',
          'query.only_general_sum':
            'Integer option for overall time spent across the matching data. Use this mode for a grand total when detail rows and daily groups are unnecessary.',
        },
      },
      list_service_desk_services: {
        source: 'serviceDeskServices.retrieveServicesList',
        description:
          'Find service IDs, configured routing and external-recipient policies for service desk cards.',
      },
      get_card_sla: {
        source: 'cardSla.retrieveCardSlaMeasurements',
        description:
          'Read a card’s SLA rules, working calendars, and measurements. Refer to actual_time for working minutes spent.',
        fields: {card_id: cardId},
      },
      list_automations: {
        source: 'automations.getListOfAutomations',
        description:
          'Read a space’s automation UIDs, status, trigger and full condition/action definitions.',
        fields: {space_id: spaceId},
      },
    },
  },
  workflows_write: {
    description: [
      'Change Kaiten iteration membership and schedules, time logs, service desk recipients and automation rules, or route a new card through a configured incoming webhook.',
      'Read current state and IDs with kaiten_workflows_read before writing.',
      '- Iterations. Writes require the feature and space access. Use add_iteration_member or remove_iteration_member with card_uids for 1–500 distinct cards. Kaiten checks restrictions before any bulk write. A later failure can leave earlier batches applied. delete_iteration permanently removes original links. Pass new_iteration_id for deletion or body.new_iteration_id when closing to transfer eligible cards to a planned or active iteration in the same space.',
      '- Time. To record an hour with add_card_time_log, pass the numeric card_id and a body such as {"time_spent":60,"for_date":"2026-11-24","role_id":-1}. Edits use the time_log_id returned for that card.',
      '- Recipients and rules. Check the service’s recipient policy. Read the current automation before replacing its action list or condition tree. Deleting a rule leaves its past card changes in place.',
      '- Card creation. Use send_card_webhook for the explicitly configured destination. The secret URL determines routing and Kaiten’s REST token stays off the webhook request. Use kaiten_cards_write for normal card creation.',
      'Failures including HTTP 429 are returned without automatic retries. Re-read upstream state before retrying a write with an uncertain outcome.',
    ].join('\n'),
    operations: {
      create_iteration: {
        source: 'iterations.createIteration',
        description:
          'Create a planned iteration in a space with Iterations enabled.',
        fields: {
          space_uid: spaceUid,
          body: 'The planned iteration title, goal and dates.',
          'body.title': 'Title displayed for the new iteration.',
          'body.goal': 'Optional goal. Null leaves it unset.',
          ...iterationDates,
        },
        outputFields: {result: 'The selected mutation’s native Kaiten JSON.'},
      },
      update_iteration: {
        source: 'iterations.updateIteration',
        description:
          'Edit the iteration or move it through planned, active and closed. Supply at least one of title, goal, status, start_date or finish_date.',
        fields: {
          space_uid: spaceUid,
          id: iterationId,
          body: 'Fields to update. Unspecified fields keep their current values.',
          'body.title': 'New title for this iteration.',
          'body.goal': 'New goal. Null clears it.',
          'body.status':
            'Native lifecycle state. Check the current state before moving to active or closed.',
          ...iterationDates,
          'body.actual_finish_date':
            'Actual completion date, ISO 8601 or null.',
          'body.new_iteration_id':
            'On closure, optionally move eligible cards to this iteration in the same space.',
        },
      },
      delete_iteration: {
        source: 'iterations.deleteIteration',
        description:
          'Remove the iteration and its original card links permanently. A valid replacement can receive the cards.',
        fields: {
          space_uid: spaceUid,
          id: iterationId,
          new_iteration_id:
            'Optional planned or active replacement iteration UUID from the same space. Omission sends no body; null sends an explicit empty replacement.',
        },
      },
      add_iteration_member: [
        {
          source: 'iterations.addCardToIteration',
          description:
            'Add one active card from a primary board of this space to a planned or active iteration. This transfers the card if it already belongs to another planned or active iteration.',
          fields: {
            space_uid: spaceUid,
            iteration_id: iterationId,
            card_uid: cardUid,
          },
        },
        {
          source: 'iterations.addCardsToIteration',
          description:
            'Add active cards from primary boards of this space to a planned or active iteration. Cards in another planned or active iteration move to the target. Kaiten checks addition and active-source removal restrictions for the whole batch before writing. Later errors can leave transactions of up to 100 cards applied. Re-read memberships and card iteration histories before retrying.',
          fields: {
            space_uid: spaceUid,
            iteration_id: iterationId,
            card_uids:
              'Supply 1 to 500 distinct card UUIDs. Get each result.uid from kaiten_cards_read get_card with format=full.',
          },
          output: z.object({
            result: z.looseObject({
              added: memberships.describe(
                'New memberships in the target iteration.',
              ),
              removed: memberships.describe(
                'Memberships removed from previous iterations during transfers.',
              ),
              skipped: memberships.describe(
                'Existing memberships already in the target iteration.',
              ),
              ineligible: z
                .array(z.string())
                .describe(
                  'Card UUIDs that became ineligible during execution.',
                ),
            }),
          }),
        },
      ],
      remove_iteration_member: [
        {
          source: 'iterations.removeCardFromIteration',
          description:
            'Remove one card’s manual membership by card UID. This leaves the card intact. Closed iterations reject removal.',
          fields: {
            space_uid: spaceUid,
            iteration_id: iterationId,
            uid: 'UUID of one card to remove. Use card_uid from list_iteration_memberships.',
          },
        },
        {
          source: 'iterations.removeCardsFromIteration',
          description:
            'Bulk-remove manual memberships and return the records actually removed. Kaiten ignores cards outside the iteration and checks all restrictions before writing. Writes run in batches of up to 100, so an execution error can leave earlier batches applied. Read back memberships before retrying.',
          fields: {
            space_uid: spaceUid,
            iteration_id: iterationId,
            card_uids:
              'Supply 1 to 500 distinct card UIDs from list_iteration_memberships for the bulk form.',
          },
          output: z.object({
            result: z.looseObject({
              removed: z
                .array(z.json())
                .describe('Manual membership records that Kaiten removed.'),
            }),
          }),
        },
      ],
      add_card_time_log: {
        source: 'cardTimeLogs.addTimeLog',
        description:
          'Record time in minutes for the given card and calendar date.',
        fields: {
          card_id: cardId,
          body: 'Work date, role and duration.',
          ...timeLogBody,
        },
      },
      update_card_time_log: {
        source: 'cardTimeLogs.updateLogRecord',
        description:
          'Edit at least one field of an existing time-log entry. Omitted fields stay unchanged.',
        fields: {
          card_id: cardId,
          time_log_id:
            'ID of the log record returned by list_card_time_logs or get_timesheet.',
          body: 'Fields to replace on the existing log.',
          ...timeLogBody,
        },
      },
      delete_card_time_log: {
        source: 'cardTimeLogs.removeTimeLog',
        description:
          'Delete the recorded time entry; subsequent reports exclude that entry.',
        fields: {
          card_id: cardId,
          time_log_id: 'ID of the exact log record to delete.',
        },
      },
      add_service_desk_recipient: {
        source: 'cardServiceDeskExternalRecipients.addNewRecipient',
        description:
          'Add an external address to a service desk card’s notification recipients. Kaiten enforces feature and policy restrictions.',
        fields: {
          card_id: cardId,
          email: 'Email address that should receive future card notifications.',
        },
      },
      remove_service_desk_recipient: {
        source: 'cardServiceDeskExternalRecipients.removeRecipient',
        description:
          'Remove an external address from future notifications on the given card.',
        fields: {
          card_id: cardId,
          email:
            'Exact configured address to remove, including any plus suffix.',
        },
      },
      create_automation: {
        source: 'automations.createAutomation',
        description:
          'Configure an event, date, or on-demand rule. Event and date types require a trigger. On-demand requires a name. Supply at least one action.',
        fields: {
          space_id: spaceId,
          body: 'Select the trigger-based or on-demand definition to match the intended rule.',
          'body.type':
            'on_action for an event, on_date for a date trigger, or on_demand for the named manually triggered rule.',
          'body.name': 'Display name. Required for on-demand rules.',
          'body.trigger':
            'Event/date trigger type and its native settings. Applies only to triggered rules.',
          'body.conditions':
            'Recursive condition groups, joined by and/or, for triggered rules.',
          'body.actions':
            'Nonempty list of native actions with type and settings.',
        },
      },
      update_automation: {
        source: 'automations.updateAutomation',
        description:
          'Update only supplied rule fields. Provide the full desired action list or condition tree when changing it.',
        fields: {
          space_id: spaceId,
          automation_uid: automationUid,
          body: 'Fields to update. Inspect the current rule first to retain existing actions and conditions.',
          'body.type':
            'Rule kind controlling which trigger fields can be supplied.',
          'body.name': 'New display name for the rule.',
          'body.trigger':
            'Replacement trigger and settings when changing a trigger-based rule.',
          'body.conditions':
            'Replacement recursive condition tree for a triggered rule.',
          'body.actions':
            'Complete desired action list, with at least one action if supplied.',
        },
      },
      delete_automation: {
        source: 'automations.deleteAutomation',
        description:
          'Remove the rule by UID. Existing card changes made by it are not rolled back.',
        fields: {space_id: spaceId, automation_uid: automationUid},
      },
      send_card_webhook: {
        source: 'sendCardWebhook',
        description:
          'Create a card through a previously configured incoming webhook. HTTPS is required except for local loopback. No API token is sent and redirects are not followed.',
        fields: {
          webhook_url:
            'Exact secret webhook URL configured for the intended destination. Do not include it in user-facing summaries.',
          body: 'Card title and optional fields accepted by the incoming webhook.',
          'body.title': 'Title of the new card.',
          'body.description': 'Text to store in the description of the card.',
          'body.asap': 'Whether to mark the card urgent.',
          'body.due_date': 'Native Kaiten due date sent to the webhook.',
          'body.owner_id': 'Numeric Kaiten user ID to set as card owner.',
          'body.links': 'External links and their optional descriptions.',
          'body.members': 'Numeric Kaiten user IDs to include as card members.',
          'body.tags': 'Tag names passed to the webhook.',
          'body.properties':
            'Native id_ property keys and values. Resolve the property definitions before assigning them.',
        },
      },
    },
  },
};
