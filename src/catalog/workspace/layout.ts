import * as z from 'zod/v4';
import type {CatalogRoute} from '../../catalog.ts';
import {id} from '../../schemas.ts';

const spaceId = 'Numeric ID from list_spaces.';
const boardId = 'Numeric ID from list_boards or get_board.';
const columnId = 'Numeric ID from list_columns for this board.';
const offset =
  'Zero-based row offset. Keep the same filters and advance by the rows received.';
const localOffset =
  'Zero-based index into the fetched list. Reuse next_offset until it is null.';
const limit = 'Maximum number of entries in the page.';
const force =
  'When true, cascade deletion to related data. Omit or set false to leave the safeguard in effect.';
const columnType =
  'Workflow stage: 1 for queue, 2 for in progress, 3 for done.';
const wipType =
  'Whether the work-in-progress limit counts cards (1) or total card size (2).';

function native(route: CatalogRoute): CatalogRoute {
  return {
    ...route,
    input: source =>
      source.safeExtend({
        format: z
          .literal('native')
          .describe('Return the complete Kaiten response under result.'),
      }),
    mapArgs: args => {
      const nativeArgs = {...args};
      delete nativeArgs['format'];
      return nativeArgs;
    },
  };
}

export const layoutReads = {
  list_spaces: [
    {
      source: 'list_spaces',
      description:
        'Discover accessible spaces before selecting a board. Follow next_offset for further pages.',
      fields: {limit, offset},
    },
    native({
      source: 'spaces.retrieveListOfSpaces',
      description:
        'Read one upstream space page with all metadata and Kaiten defaults for omitted paging fields.',
      fields: {limit, offset},
    }),
  ],
  get_space: [
    {
      source: 'get_space',
      description:
        'Validate a selected space ID and read its available board references.',
      fields: {space_id: spaceId},
    },
    native({
      source: 'spaces.retrieveSpace',
      description: 'Read complete metadata for a known space.',
      fields: {space_id: spaceId},
    }),
  ],
  list_boards: [
    {
      source: 'list_boards',
      description:
        'Discover boards in a specific space. The server fetches the list and slices it locally.',
      fields: {space_id: spaceId, limit, offset: localOffset},
    },
    native({
      source: 'spaceBoards.getListOfBoards',
      description: 'Read the unsliced board list with complete board metadata.',
      fields: {space_id: spaceId},
    }),
  ],
  get_board: [
    {
      source: 'get_board',
      description:
        'Read a known board’s columns, lanes and custom property configuration.',
      fields: {board_id: boardId},
    },
    native({
      source: 'boards.getBoard',
      description: 'Read the complete board configuration by global board ID.',
      fields: {board_id: boardId},
    }),
    {
      source: 'spaceBoards.getBoard',
      description:
        'Read the complete board configuration under the given space. Use this to verify a board belongs to that space.',
      fields: {space_id: spaceId, board_id: boardId},
      input: source => source.omit({id: true}).safeExtend({board_id: id}),
      mapArgs: ({space_id, board_id}) => ({space_id, id: board_id}),
    },
  ],
  list_columns: [
    {
      source: 'list_columns',
      description:
        'Find destination column IDs in board order, with local pagination.',
      fields: {board_id: boardId, limit, offset: localOffset},
    },
    native({
      source: 'columns.getListOfColumns',
      description: 'Read all columns and their complete workflow settings.',
      fields: {board_id: boardId},
    }),
  ],
  list_lanes: [
    {
      source: 'list_lanes',
      description:
        'Find destination swimlane IDs. The server slices the upstream list locally.',
      fields: {board_id: boardId, limit, offset: localOffset},
    },
    native({
      source: 'lanes.getListOfLanes',
      description:
        'Read the unsliced list with full metadata and an optional lane lifecycle filter.',
      fields: {
        board_id: boardId,
        condition: 'String condition code: 1 live, 2 archived, or 3 deleted.',
      },
    }),
  ],
  list_subcolumns: {
    source: 'subcolumn.getListOfSubcolumns',
    description:
      'Read the child columns of one parent column, including their ordering and workflow stage.',
    fields: {column_id: columnId},
  },
} satisfies Record<string, CatalogRoute | readonly CatalogRoute[]>;

const columnOptions = {
  'body.type': columnType,
  'body.sort_order':
    'Position among sibling columns. Use list_columns or list_subcolumns for existing order.',
  'body.last_moved_warning_after_days':
    'Days component of the stale-card warning threshold.',
  'body.last_moved_warning_after_hours':
    'Hours component of the stale-card warning threshold.',
  'body.last_moved_warning_after_minutes':
    'Minutes component of the stale-card warning threshold.',
  'body.col_count': 'Width of the column in layout units.',
  'body.archive_after_days':
    'Number of days after which Kaiten automatically archives cards in the column.',
  'body.card_hide_after_days':
    'Days after which Kaiten hides cards in the column. Null clears the setting.',
  'body.months_to_hide_cards':
    'Month-based hiding threshold. Null clears the setting.',
};

const laneOptions = {
  'body.sort_order':
    'Position among the board’s lanes. Read existing lane order first.',
  'body.row_count': 'Height of the lane in layout units.',
  'body.wip_limit_type': wipType,
  'body.last_moved_warning_after_days':
    'Days component of the stale-card warning threshold.',
  'body.last_moved_warning_after_hours':
    'Hours component of the stale-card warning threshold.',
  'body.last_moved_warning_after_minutes':
    'Minutes component of the stale-card warning threshold.',
};

export const layoutWrites = {
  create_space: {
    source: 'spaces.createNewSpace',
    description:
      'Create a workspace space. Choose a parent tree entity and access role before creating a nested or company-visible space.',
    fields: {
      'body.parent_entity_uid':
        'Parent folder or tree entity UID from list_tree_entities.',
      'body.for_everyone_access_role_id':
        'Tree access role UID for company-wide access. Discover roles with list_tree_roles.',
      'body.work_calendar_id':
        'UID of the Kaiten work calendar to associate with the space.',
    },
  },
  update_space: {
    source: 'spaces.updateSpace',
    description:
      'Patch a space’s name, position or visibility. Changes to access can expose or restrict the space for other users.',
    fields: {
      space_id: spaceId,
      'body.access':
        'for_everyone gives company-wide visibility. by_invite restricts access to invited users.',
      'body.parent_entity_uid':
        'Destination tree entity UID. Null removes the parent association.',
      'body.hidden_card_type_uids':
        'Card type UIDs to hide in this space. Use UIDs from card type metadata.',
    },
  },
  delete_space: {
    source: 'spaces.removeSpace',
    description:
      'Delete the identified space. Verify its title and board list with get_space and list_boards first. The public space API exposes no restore call.',
    fields: {space_id: spaceId},
  },
  create_board: {
    source: 'spaceBoards.createNewBoard',
    description:
      'Create a board in an existing space. Include columns or lanes to define the initial layout in the same request.',
    fields: {
      space_id: spaceId,
      'body.columns': 'Initial column definitions in the new board.',
      'body.columns.type': columnType,
      'body.lanes': 'Initial swimlane definitions in the new board.',
      'body.default_card_type_id':
        'Numeric card type ID assigned to new cards on this board.',
    },
  },
  update_board: {
    source: 'spaceBoards.updateBoard',
    description:
      'Patch board settings within a space, including card defaults, movement and required properties. Configured movement policies affect future card moves.',
    fields: {
      space_id:
        'Numeric ID of the space used for this request. When moving a board, this is the destination space.',
      id: boardId,
      'body.move_from_space_id':
        'Source space ID when moving a board into space_id. Omit for edits in place.',
      'body.card_properties':
        'Board-specific property rules. laneIds, columnIds and cardTypeIds scope when a property is required.',
      'body.card_properties.key':
        'Kaiten custom property key in id_<propertyId> form.',
      'body.cell_wip_limits':
        'Native board cell work-in-progress limit configurations.',
      'body.default_card_type_id':
        'Numeric card type ID assigned to new cards on this board.',
    },
  },
  delete_board: {
    source: 'spaceBoards.removeBoard',
    description:
      'Delete a board within its owning space. Check layout and cards before removal. Force permits cascading deletion of related data.',
    fields: {space_id: spaceId, id: boardId, force},
  },
  create_column: {
    source: 'columns.createNewColumn',
    description:
      'Add a workflow column to an existing board. Choose the stage and WIP unit before moving cards into it.',
    fields: {
      board_id: boardId,
      ...columnOptions,
      'body.wip_limit_type': wipType,
    },
  },
  update_column: {
    source: 'columns.updateColumn',
    description:
      'Patch a column’s stage, order or work-in-progress and SLA rules. This changes the workflow for cards using that column.',
    fields: {
      board_id: boardId,
      column_id: columnId,
      ...columnOptions,
      'body.wip_limit':
        'Work-in-progress limit in the selected unit. Null removes the limit.',
      'body.wip_limit_type': wipType,
      'body.prev_column_id':
        'Place after this column in the same board. Null clears the reference.',
      'body.next_column_id':
        'Place before this column in the same board. Null clears the reference.',
      'body.pause_sla': 'Pause SLA timers for cards in this column when true.',
    },
  },
  delete_column: {
    source: 'columns.removeColumn',
    description:
      'Delete a board column. Move cards that must be retained before deleting it. Kaiten can reject non-cascade deletion when related data remains.',
    fields: {board_id: boardId, column_id: columnId, force},
  },
  create_subcolumn: {
    source: 'subcolumn.createNewSubcolumn',
    description: 'Add a child workflow stage under a known parent column.',
    fields: {column_id: columnId, ...columnOptions},
  },
  update_subcolumn: {
    source: 'subcolumn.updateSubcolumn',
    description:
      'Patch a child stage’s settings, sibling position, or SLA pause policy. These rules apply to cards in the subcolumn.',
    fields: {
      column_id: columnId,
      subcolumn_id: 'Numeric child column ID from list_subcolumns.',
      ...columnOptions,
      'body.prev_column_id':
        'Previous sibling column ID. Null clears the reference.',
      'body.next_column_id':
        'Next sibling column ID. Null clears the reference.',
      'body.pause_sla':
        'Pause SLA timers for cards in this subcolumn when true.',
    },
  },
  delete_subcolumn: {
    source: 'subcolumn.removeSubcolumn',
    description:
      'Delete a child column from its parent column. Move cards that must be retained before a cascade.',
    fields: {
      column_id: columnId,
      subcolumn_id: 'Numeric child column ID from list_subcolumns.',
      force,
    },
  },
  create_lane: {
    source: 'lanes.createNewLane',
    description:
      'Add a swimlane across the columns of one board. Specify a WIP unit when setting a lane limit.',
    fields: {board_id: boardId, ...laneOptions},
  },
  update_lane: {
    source: 'lanes.updateLane',
    description:
      'Patch a lane’s rules or visibility. Set condition to 2 to archive a lane and to 1 to make it live.',
    fields: {
      board_id: boardId,
      lane_id: 'Numeric ID from list_lanes for this board.',
      ...laneOptions,
      'body.condition': 'Lane lifecycle state: 1 live, 2 archived.',
      'body.wip_limit':
        'Work-in-progress limit in the selected unit. Null removes the limit.',
      'body.default_card_type_id':
        'Default type for new cards in this lane. Null clears the lane override.',
    },
  },
  delete_lane: {
    source: 'lanes.removeLane',
    description:
      'Delete a board lane. Use update_lane with archived condition when the lane only needs to be hidden. Force can delete related data.',
    fields: {
      board_id: boardId,
      lane_id: 'Numeric ID from list_lanes for this board.',
      force,
    },
  },
} satisfies Record<string, CatalogRoute>;
