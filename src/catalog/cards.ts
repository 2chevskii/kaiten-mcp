import * as z from 'zod/v4';
import {canonicalCardBatchBody} from '../card-schemas.ts';
import type {CatalogDefinition} from '../catalog.ts';
import {hasChanges, id} from '../schemas.ts';

const nativeCard = z.looseObject({
  id: id.describe('Numeric Kaiten card ID.'),
  uid: z
    .string()
    .optional()
    .describe(
      'Card UID when returned. Use it for restricted attachment operations.',
    ),
});
const nativeCardResult = z.object({result: nativeCard});

const cardId = {
  card_id: 'Numeric ID of an existing card returned by search_cards.',
};

const layoutFields = {
  board_id: 'Board ID from workspace list_boards.',
  column_id: 'Column ID on the selected board, from workspace get_board.',
  lane_id: 'Lane ID on the selected board, from workspace get_board.',
};

const dates = {
  due_date_before:
    'Return cards with a due date before this date or timestamp.',
  due_date_after: 'Return cards with a due date after this date or timestamp.',
};

const identityFilters = {
  owner_ids: 'Kaiten user IDs to match against the card owner.',
  member_ids: 'Kaiten user IDs to match against card membership.',
  responsible_ids:
    'Kaiten user IDs to match against card responsibility. For my tasks, use the token user ID.',
  states: 'Workflow state codes: 1 is queued, 2 is in progress, 3 is done.',
  archived:
    'Set true to match archived cards or false to match unarchived cards.',
  asap: 'Match the urgent (ASAP) flag.',
  overdue: 'Match whether the card is overdue.',
  type_ids: 'Card type IDs from workspace card types.',
  tag_ids: 'Tag IDs from workspace tag discovery.',
};

const searchFields = {
  ...layoutFields,
  ...dates,
  ...identityFilters,
  space_id:
    'Limit to an explicitly chosen space. Omit for searches across accessible spaces.',
  query: 'Text search. Combine it with filters to narrow matching cards.',
  limit: 'Summaries per page. Reuse the same limit on subsequent pages.',
  cursor:
    'Pass the previous next_cursor verbatim with the same filters and limit. Omit to start at the first page.',
};

const nativeSearchFields = {
  query:
    'Kaiten search filters, sorting, projection and optional paging fields.',
  ...Object.fromEntries(
    Object.entries(searchFields)
      .filter(([name]) => name !== 'cursor' && name !== 'limit')
      .map(([name, description]) => [`query.${name}`, description]),
  ),
  'query.created_before': 'Upper creation timestamp bound.',
  'query.created_after': 'Lower creation timestamp bound.',
  'query.updated_before': 'Upper last-modified timestamp bound.',
  'query.updated_after': 'Lower last-modified timestamp bound.',
  'query.first_moved_in_progress_after':
    'Lower bound for the first move to in-progress.',
  'query.first_moved_in_progress_before':
    'Upper bound for the first move to in-progress.',
  'query.last_moved_to_done_at_after': 'Lower bound for the last move to done.',
  'query.last_moved_to_done_at_before':
    'Upper bound for the last move to done.',
  'query.tag':
    'Tag name for name-based matching. Use tag_ids when you already have the IDs.',
  'query.project_ids':
    'Project UUIDs, as an array or a comma-separated string without spaces. Use project_id from list_card_baselines for a card in the project. Keep the filter on continuation pages.',
  'query.column_ids':
    'Filter to multiple column IDs, using an array or the native API string.',
  'query.exclude_board_ids': 'Board IDs to exclude from matches.',
  'query.exclude_column_ids': 'Column IDs to exclude from matches.',
  'query.exclude_lane_ids': 'Lane IDs to exclude from matches.',
  'query.exclude_owner_ids': 'Owner user IDs to exclude from matches.',
  'query.exclude_card_ids': 'Card IDs to exclude from matches.',
  'query.organizations_ids':
    'Organization IDs to match for service-desk requests.',
  'query.external_id':
    'Match an external integration ID rather than the numeric Kaiten card ID.',
  'query.additional_card_fields':
    'Request the description when the search projection omits it.',
  'query.search_fields': 'Fields for Kaiten to use when matching query text.',
  'query.include_search_preview': 'Request match previews with text search.',
  'query.condition':
    'Card lifecycle condition. Use states to filter workflow progress instead.',
  'query.type_id': 'Match a single card type ID.',
  'query.responsible_id': 'Match a single responsible user ID.',
  'query.owner_id': 'Match a single owner user ID.',
  'query.done_on_time': 'Match whether completion occurred by the due date.',
  'query.with_due_date': 'Match presence or absence of a due date.',
  'query.filter':
    'Nested and/or filter or its Kaiten base64 representation. The client encodes a structured filter automatically.',
  'query.order_by': 'Field names in order of sort precedence.',
  'query.order_direction':
    'One sorting direction per order_by field, in the same order.',
  'query.order_space_id': 'Apply ordering from the specified space.',
  'query.is_request': 'Match card service requests.',
  'query.broken_api':
    'Kaiten user-property format flag: true returns UID strings; false returns numeric IDs.',
  'query.start_position':
    'For native v2, pass the previous position with the same filters and sorting. An empty position ends the search.',
  'query.limit':
    'Maximum cards in this Kaiten API page, up to 100. The API defaults to 100.',
};

const editableFields = {
  title: 'Card title.',
  description:
    'Card description, with its format determined by text_format_type_id. Null clears it on update.',
  due_date:
    'ISO 8601 deadline, such as 2026-12-15T18:00:00+03:00. Null clears it.',
  due_date_time_present:
    'Set true for a timed deadline with due_date. False represents a date-only deadline.',
  asap: 'Set or clear the urgent (ASAP) flag.',
  sort_order: 'Explicit ordering value for the card in its cell.',
  expires_later:
    'Whether the deadline moves rather than staying fixed under Kaiten’s date-dependent Kanban rules.',
  size_text: 'Size label displayed on the card. Null clears it on update.',
  owner_id: 'Numeric owner ID from kaiten_workspace_read list_company_users.',
  type_id:
    'Numeric ID from kaiten_workspace_read list_card_types. Choose a type supported by the destination board.',
  service_id:
    'Service desk service ID from workflows. Null clears the association on update.',
  external_id:
    'Integration-owned identifier external to Kaiten. Null clears it on update.',
  text_format_type_id:
    'Kaiten description format: 1 for Markdown, 2 for HTML, 3 for Jira wiki markup.',
  properties:
    'Resolve the property ID and type with kaiten_custom_properties_read. For example, a select property with ID 7 and option 23 uses {"id_7": [23]}.',
  owner_email: 'Company user email for email-based owner assignment.',
};

function bodyFields(fields: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fields).map(([name, description]) => [
      `body.${name}`,
      description,
    ]),
  );
}

export const cardsCatalog: CatalogDefinition = {
  cards_read: {
    description: [
      'Search Kaiten cards or inspect a card’s details, baselines and movement history.',
      '- Search. Filter by card text, location, role or status with search_cards (limit defaults to 25). Reuse filters with cursor=next_cursor. For native cursor pages, use mode=native_page with query.version=2 and reuse position as query.start_position. Use query.project_ids in native pages or scan_cards to filter by project.',
      '- Snapshot. Use scan_cards with max_items (default 100). If truncated, restart with paged search.',
      '- Filter tokens. Use encode_card_filter for standalone base64 reuse. Native search accepts the filter object directly.',
      '- Identity. For my cards, call kaiten_workspace_read get_current_user. Use responsible_ids=[id] (query.responsible_ids in native mode) unless the request or connection specifies another filter.',
      '- Follow-up. Results follow the token’s access. Use get_card for details, kaiten_collaboration_read for discussion or links, and kaiten_content_read for attachments.',
      '- Workflows. Use kaiten_workflows_read list_iteration_memberships for cards in an iteration or list_card_iteration_history for one card’s participation. Read logged time with list_card_time_logs and SLA measurements with get_card_sla.',
    ].join('\n'),
    operations: {
      search_cards: [
        {
          source: 'search_cards',
          description:
            'Page through card summaries in ascending ID order. Repeat the same filters with next_cursor until it is null.',
          fields: searchFields,
          outputFields: {
            items: 'Card summaries in ascending ID order.',
            next_cursor:
              'Pass to the same search as cursor. Null means the search is exhausted.',
          },
        },
        {
          source: 'cards.retrieveCardList',
          description:
            'Read one native page for custom projections, sorting or complex filters. Match version 1 to arrays and version 2 to native pagination metadata.',
          input: input =>
            input.extend({
              mode: z
                .literal('native_page')
                .describe(
                  'Opt into the Kaiten query and response contract for a single search page.',
                ),
            }),
          mapArgs: ({query}) => ({query}),
          output: z.object({
            result: z
              .union([
                z.array(nativeCard),
                z.looseObject({
                  result: z
                    .array(nativeCard)
                    .describe('Cards in the native v2 page.'),
                  position: z
                    .string()
                    .describe(
                      'Opaque position for the next native v2 page. An empty string ends the search.',
                    ),
                }),
              ])
              .describe('Native search v1 array or v2 page.'),
          }),
          fields: {
            ...nativeSearchFields,
            'query.version':
              'Select Kaiten list response version 1 (array) or 2 (native page object).',
            'query.offset':
              'Zero-based API page offset. Use the same filters and ordering when advancing it.',
          },
        },
      ],
      scan_cards: {
        source: 'cards.iterate',
        output: z.object({
          result: z.object({
            items: z
              .array(nativeCard)
              .describe('Cards collected across upstream pages.'),
            truncated: z
              .boolean()
              .describe(
                'True when additional matches remain after the requested cap.',
              ),
          }),
        }),
        description:
          'Collect a bounded snapshot across native search pages. Result truncated means the cap was reached with additional data available; use search_cards to resume a pageable workflow.',
        fields: {
          ...nativeSearchFields,
          max_items:
            'Total card limit across all fetched pages. The default is 100, maximum 1000.',
        },
      },
      get_card: [
        {
          source: 'get_card',
          description:
            'Read a selected card with its full description and useful member, tag, checklist and relationship references.',
          fields: cardId,
        },
        {
          source: 'cards.retrieveCard',
          output: nativeCardResult,
          description:
            'Read full upstream card JSON when you need additional native fields such as card UID, file metadata or scheduling data.',
          input: input =>
            input.extend({
              format: z
                .literal('full')
                .describe('Include the native card fields in result.'),
            }),
          mapArgs: ({card_id, broken_api}) => ({card_id, broken_api}),
          fields: {
            ...cardId,
            broken_api:
              'Kaiten user-property format flag: true returns UID strings; false returns numeric IDs.',
          },
        },
      ],
      list_card_baselines: {
        source: 'cards.retrieveCardBaselines',
        description:
          'Read unarchived baselines of unarchived projects connected to this card. Use result[].project_id in query.project_ids to filter native card searches.',
        fields: cardId,
      },
      list_card_location_history: {
        source: 'cards.retrieveCardLocationHistory',
        description:
          'Read the historical board, column and lane movements of one card.',
        fields: cardId,
      },
      encode_card_filter: {
        source: 'encodeCardFilter',
        output: z.object({
          result: z.string().describe('Kaiten base64 card filter token.'),
        }),
        description:
          'Serialize a reusable Kaiten card-filter token locally for use by external integrations. The native search and scan operations accept structured filters directly.',
        fields: {
          filter:
            'An AND/OR tree with filter groups and comparison clauses; the result is a base64 token.',
        },
      },
    },
  },
  cards_write: {
    description: [
      'Create, edit, move, archive, restore or delete Kaiten cards.',
      '- Create. Resolve numeric layout and user IDs with kaiten_workspace_read. To reuse a card type’s description template, call kaiten_workspace_read get_card_type and pass result.id as body.type_id and selected text from result.description_template as body.description.',
      '- Edit. Use update_card for a single card and include body.properties when changing fields and values together. Include initial property values in create_card. Use kaiten_custom_properties_write set_card_properties for property-only changes on existing cards.',
      '- Batch. Preview targets with kaiten_cards_read search_cards. Put a selector such as body.board_id alongside body.attributes, or send body.column_id, body.lane_id and body.order_by to sort one cell. Batches return a background job ID.',
      '- Archive. Archiving a card in a queued or in-progress column removes its parent and child links. Read the relations with get_card before archiving. Reactivation only changes the card condition.',
      '- Effects. Kaiten checks card and board permissions. Deletion is permanent. Verify state before retrying after a timeout.',
    ].join('\n'),
    operations: {
      create_card: {
        source: 'cards.createNewCard',
        output: nativeCardResult,
        replaces: ['create_card', 'cards.create'],
        description:
          'Create one card with a title and board. Omit column and lane to let Kaiten choose placement; supply them for a specific cell. Returns the created card.',
        fields: {
          body: 'Send title and board_id. Add column_id and lane_id for an explicit cell. Resolve the IDs from workspace tools.',
          ...bodyFields({
            ...layoutFields,
            ...editableFields,
            description:
              'Card text in the format selected by text_format_type_id. To apply a card type description template, pass its text explicitly from get_card_type result.description_template.',
            responsible_id:
              'Numeric company user ID from kaiten_workspace_read list_company_users for the initial responsible member.',
            position:
              'Set 1 for the start or 2 for the end of the cell. This overrides sort_order.',
          }),
        },
      },
      update_card: {
        source: 'cards.updateCard',
        output: nativeCardResult,
        replaces: ['update_card'],
        description:
          'Patch supplied fields. Omission preserves a field; explicit null clears nullable values. Use move_card for explicit placement, archive_card or restore_card for lifecycle, and custom_properties_write to update only custom values.',
        input: input =>
          input.refine(
            args =>
              typeof args.body === 'object' &&
              args.body !== null &&
              hasChanges(args.body),
            'Supply at least one card field.',
          ),
        fields: {
          ...cardId,
          body: 'Send at least one field to change. For example, {"due_date": null} clears the deadline while leaving omitted fields as they were.',
          ...bodyFields({
            ...layoutFields,
            ...editableFields,
            blocked:
              'Sets the card blocked flag. Manage detailed blocker records with collaboration_write.',
            condition:
              'Use 1 to activate or 2 to archive. Archiving in a queued or in-progress column removes parent and child links.',
            sd_new_comment:
              'Set or clear the service-desk new-comment indicator.',
            prev_card_id: 'Place after the card identified by this ID.',
            estimate_workload: 'Estimated workload in hours.',
            ignore_planned_dates_recalculation:
              'Control whether Kaiten skips automatic planned-date recalculation for the card.',
          }),
        },
      },
      move_card: {
        source: 'move_card',
        description:
          'Move a single card into an explicit board cell with all three location IDs.',
        fields: {...cardId, ...layoutFields},
      },
      archive_card: {
        source: 'archive_card',
        description:
          'Archive a card. Archiving in a queued or in-progress column removes its parent and child links. Read its relations with kaiten_cards_read get_card first.',
        fields: cardId,
      },
      restore_card: {
        source: 'restore_card',
        description:
          'Reactivate an archived card by changing its condition. Recreate any removed parent and child links separately.',
        fields: cardId,
      },
      delete_card: {
        source: 'cards.deleteCard',
        output: nativeCardResult,
        replaces: ['delete_card'],
        description:
          'Delete the selected card. Select archive_card when future recovery may be needed.',
        fields: cardId,
      },
      batch_update_cards: {
        source: 'cards.batchUpdateForCards',
        input: input => input.safeExtend({body: canonicalCardBatchBody}),
        output: z.object({
          result: z.looseObject({
            id: z.string().describe('Background job ID assigned by Kaiten.'),
          }),
        }),
        description:
          'Change all cards matching the given selectors, or sort one explicit cell. Confirm the selection with kaiten_cards_read search_cards before mutation. Kaiten runs this job in the background.',
        fields: {
          body: 'For a patch, send at least one of board_id, column_id, lane_id, owner_id, type_id or condition with attributes. For a sort, send column_id, lane_id and order_by.',
          ...bodyFields({
            board_id: 'Select cards on this board.',
            column_id:
              'Select cards in this column, or choose the column of the cell to sort.',
            lane_id:
              'Select cards in this lane, or choose the lane of the cell to sort.',
            owner_id: 'Select cards currently owned by this Kaiten user.',
            type_id: 'Select cards of this card type.',
            condition:
              'Select by lifecycle condition: 1 is active, 2 is archived.',
            attributes:
              'Values to apply to the selected cards. The outer fields select cards; the attributes fields are the replacement values.',
            'attributes.board_id': 'New board for the selected cards.',
            'attributes.column_id': 'New column for the selected cards.',
            'attributes.lane_id': 'New lane for the selected cards.',
            'attributes.condition':
              'Use 1 to activate or 2 to archive. Kaiten removes parent/child links when it archives cards in queued or in-progress columns.',
            'attributes.owner_id': editableFields.owner_id,
            'attributes.type_id': editableFields.type_id,
            'attributes.title': editableFields.title,
            'attributes.asap': editableFields.asap,
            'attributes.due_date': editableFields.due_date,
            'attributes.due_date_time_present':
              editableFields.due_date_time_present,
            'attributes.sort_order': editableFields.sort_order,
            'attributes.description': editableFields.description,
            'attributes.expires_later': editableFields.expires_later,
            'attributes.size_text': editableFields.size_text,
            'attributes.service_id': editableFields.service_id,
            'attributes.blocked':
              'Send false to release all blocks for each matched card.',
            'attributes.external_id': editableFields.external_id,
            order_by:
              'Sort a cell using column_id and lane_id. For example, send {"field_type": "due_date", "direction": "asc"}.',
            'order_by.field_type':
              'Use cp for a custom property and supply its numeric ID in order_by.id.',
            'order_by.id': 'Custom property ID for a cp sort.',
            'order_by.direction': 'Ascending or descending order.',
          }),
        },
      },
    },
  },
};
