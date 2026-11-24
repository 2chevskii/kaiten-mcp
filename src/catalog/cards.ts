import * as z from 'zod/v4';
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
  due_date: 'Date or date-time, in Kaiten format. Null clears the due date.',
  due_date_time_present:
    'Whether Kaiten should display a time with the due date.',
  asap: 'Set or clear the urgent (ASAP) flag.',
  sort_order: 'Explicit ordering value for the card in its cell.',
  expires_later:
    'Whether the deadline moves rather than staying fixed under Kaiten’s date-dependent Kanban rules.',
  size_text: 'Size label displayed on the card. Null clears it on update.',
  owner_id:
    'Kaiten user ID of the card owner, distinct from its responsible member.',
  type_id: 'Card type ID supported by the destination board.',
  service_id:
    'Service desk service ID from workflows. Null clears the association on update.',
  external_id:
    'Integration-owned identifier external to Kaiten. Null clears it on update.',
  text_format_type_id:
    'Kaiten description format: 1 for Markdown, 2 for HTML, 3 for Jira wiki markup.',
  properties:
    'Custom values keyed by id_<propertyId>. Read property definitions first for each value shape.',
  owner_email:
    'Email identifying the owner when using Kaiten email-based assignment.',
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
    description:
      'Find Kaiten cards by text, location, participant or state, and inspect fields, baselines or movement history. For my cards, follow the connection instructions for identity and role. The default is the user from kaiten_workspace_read get_current_user in responsible_ids. Search for candidates, then get_card for the selected card. Use kaiten_collaboration_read for discussion and relationships and kaiten_content_read for attachments. Results reflect the token’s access.',
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
          'Read unarchived baselines of unarchived projects connected to this card.',
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
    description:
      'Create and edit Kaiten cards, move them across board cells, and manage their lifecycle. Discover target layout and users with kaiten_workspace_read. Update one card with update_card, and use batch_update_cards for an explicitly selected set or cell sort. Check affected cards before a batch mutation. A batch returns a background job ID. Archive for reversible removal from active work. Delete removes the card without a restore operation. Kaiten checks the token user’s rights on the affected cards and boards. After a timeout, verify the resulting state before repeating a write.',
    operations: {
      create_card: {
        source: 'cards.createNewCard',
        output: nativeCardResult,
        replaces: ['create_card', 'cards.create'],
        description:
          'Create one card with a title and board. Omit column and lane to let Kaiten choose placement; supply them for a specific cell. Returns the created card.',
        fields: {
          body: 'Fields for one new card. Discover target IDs and verify field types before providing optional details.',
          ...bodyFields({
            ...layoutFields,
            ...editableFields,
            responsible_id: 'Kaiten user ID of the initial responsible member.',
            position: 'Place at the start (1) or end (2) of the target cell.',
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
          body: 'Partial card patch. Complex changes may include placement, lifecycle, or custom properties alongside regular fields.',
          ...bodyFields({
            ...layoutFields,
            ...editableFields,
            blocked:
              'Sets the card blocked flag. Manage detailed blocker records with collaboration_write.',
            condition: 'Lifecycle value: 1 activates a card, 2 archives it.',
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
          'Move a card out of active work by setting its live condition to archived. Use restore_card to reactivate it.',
        fields: cardId,
      },
      restore_card: {
        source: 'restore_card',
        description:
          'Return an archived card to active work. A card removed by delete_card has no exposed restore path.',
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
        output: z.object({
          result: z.looseObject({
            id: z.string().describe('Background job ID assigned by Kaiten.'),
          }),
        }),
        description:
          'Change all cards matching the given selectors, or sort one explicit cell. Confirm the selection with search_cards before mutation. Kaiten runs this job in the background.',
        fields: {
          body: 'Provide a selector and attributes to patch, or column_id, lane_id and order_by to sort a cell.',
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
              'New lifecycle condition: 1 activates, 2 archives.',
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
            'attributes.blocked': 'New blocked flag for each matched card.',
            'attributes.external_id': editableFields.external_id,
            order_by:
              'Cell sort specification. Supply the cell column and lane alongside it.',
            'order_by.field_type':
              'Field to sort by; cp selects a custom property.',
            'order_by.id': 'Custom property ID for a cp sort.',
            'order_by.direction': 'Ascending or descending order.',
          }),
        },
      },
    },
  },
};
