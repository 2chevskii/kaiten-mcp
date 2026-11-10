import * as z from 'zod/v4';
import {hasChanges, id, pageFields, text} from '../schemas.ts';
import {read, change, type ToolRegistry} from '../tool-registry.ts';
import {apiResult} from '../results.ts';

export function registerWorkspaceManagement(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'boards.getBoard',
    'Get board (boards); full API fields and JSON response.',
    z.strictObject({board_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.boards.getBoard(args.board_id, options),
    }),
  );
  registry.add(
    'columns.createNewColumn',
    'Create new column (columns); full API fields and JSON response.',
    z.strictObject({
      board_id: id,
      body: z.strictObject({
        external_id: z.union([z.string(), z.number()]).nullable().optional(),
        title: z.string(),
        sort_order: z.number().optional(),
        type: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
        last_moved_warning_after_days: z.number().optional(),
        last_moved_warning_after_hours: z.number().optional(),
        last_moved_warning_after_minutes: z.number().optional(),
        wip_limit: z.number().optional(),
        wip_limit_type: z.union([z.literal(1), z.literal(2)]).optional(),
        col_count: z.number().optional(),
        archive_after_days: z.number().optional(),
        months_to_hide_cards: z.number().nullable().optional(),
        card_hide_after_days: z.number().nullable().optional(),
        rules: z.number().optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.columns.createNewColumn(
        args.board_id,
        args.body as Parameters<typeof client.columns.createNewColumn>[1],
        options,
      ),
    }),
  );
  registry.add(
    'columns.getListOfColumns',
    'Get list of columns (columns); full API fields and JSON response.',
    z.strictObject({board_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.columns.getListOfColumns(args.board_id, options),
    }),
  );
  registry.add(
    'columns.removeColumn',
    'Remove column (columns); full API fields and JSON response.',
    z.strictObject({
      board_id: id,
      column_id: id,
      force: z.boolean().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.columns.removeColumn(
        args.board_id,
        args.column_id,
        args.force,
        options,
      ),
    }),
  );
  registry.add(
    'columns.updateColumn',
    'Update column (columns); full API fields and JSON response.',
    z.strictObject({
      board_id: id,
      column_id: id,
      body: z
        .strictObject({
          external_id: z.union([z.string(), z.number()]).nullable().optional(),
          title: z.string().optional(),
          sort_order: z.number().optional(),
          type: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
          wip_limit: z.number().nullable().optional(),
          wip_limit_type: z.union([z.literal(1), z.literal(2)]).optional(),
          last_moved_warning_after_days: z.number().optional(),
          last_moved_warning_after_hours: z.number().optional(),
          last_moved_warning_after_minutes: z.number().optional(),
          col_count: z.number().optional(),
          archive_after_days: z.number().optional(),
          months_to_hide_cards: z.number().nullable().optional(),
          card_hide_after_days: z.number().nullable().optional(),
          rules: z.number().optional(),
          default_tags: z.string().nullable().optional(),
          prev_column_id: id.nullable().optional(),
          next_column_id: id.nullable().optional(),
          pause_sla: z.boolean().optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.columns.updateColumn(
        args.board_id,
        args.column_id,
        args.body as Parameters<typeof client.columns.updateColumn>[2],
        options,
      ),
    }),
  );
  registry.add(
    'lanes.createNewLane',
    'Create new lane (lanes); full API fields and JSON response.',
    z.strictObject({
      board_id: id,
      body: z.strictObject({
        title: z.string(),
        sort_order: z.number().optional(),
        wip_limit: z.number().optional(),
        wip_limit_type: z.union([z.literal(1), z.literal(2)]).optional(),
        last_moved_warning_after_days: z.number().optional(),
        last_moved_warning_after_hours: z.number().optional(),
        last_moved_warning_after_minutes: z.number().optional(),
        row_count: z.number().optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.lanes.createNewLane(
        args.board_id,
        args.body as Parameters<typeof client.lanes.createNewLane>[1],
        options,
      ),
    }),
  );
  registry.add(
    'lanes.getListOfLanes',
    'Get list of lanes (lanes); full API fields and JSON response.',
    z.strictObject({board_id: id, condition: z.string().optional()}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.lanes.getListOfLanes(
        args.board_id,
        args.condition,
        options,
      ),
    }),
  );
  registry.add(
    'lanes.removeLane',
    'Remove lane (lanes); full API fields and JSON response.',
    z.strictObject({board_id: id, lane_id: id, force: z.boolean().optional()}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.lanes.removeLane(
        args.board_id,
        args.lane_id,
        args.force,
        options,
      ),
    }),
  );
  registry.add(
    'lanes.updateLane',
    'Update lane (lanes); full API fields and JSON response.',
    z.strictObject({
      board_id: id,
      lane_id: id,
      body: z
        .strictObject({
          title: z.string().optional(),
          sort_order: z.number().optional(),
          wip_limit: z.number().nullable().optional(),
          wip_limit_type: z.union([z.literal(1), z.literal(2)]).optional(),
          last_moved_warning_after_days: z.number().optional(),
          last_moved_warning_after_hours: z.number().optional(),
          last_moved_warning_after_minutes: z.number().optional(),
          row_count: z.number().optional(),
          default_tags: z.string().nullable().optional(),
          default_card_type_id: id.nullable().optional(),
          condition: z.union([z.literal(1), z.literal(2)]).optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.lanes.updateLane(
        args.board_id,
        args.lane_id,
        args.body as Parameters<typeof client.lanes.updateLane>[2],
        options,
      ),
    }),
  );
  registry.add(
    'spaceBoards.createNewBoard',
    'Create new board (spaceBoards); full API fields and JSON response.',
    z.strictObject({
      space_id: id,
      body: z.strictObject({
        title: z.union([z.string(), z.number()]),
        columns: z
          .array(
            z.strictObject({
              title: z.string(),
              sort_order: z.number().optional(),
              type: z.union([z.literal(1), z.literal(2), z.literal(3)]),
              wip_limit: z.number().optional(),
              col_count: z.number().optional(),
              archive_after_days: z.number().optional(),
              months_to_hide_cards: z.number().nullable().optional(),
              card_hide_after_days: z.number().nullable().optional(),
              rules: z.number().optional(),
              external_id: z
                .union([z.string(), z.number()])
                .nullable()
                .optional(),
              default_tags: z.string().nullable().optional(),
            }),
          )
          .optional(),
        lanes: z
          .array(
            z.strictObject({
              title: z.string(),
              sort_order: z.number().optional(),
              wip_limit: z.number().optional(),
              row_count: z.number().optional(),
              default_tags: z.string().nullable().optional(),
            }),
          )
          .optional(),
        description: z.string().nullable().optional(),
        top: z.number().optional(),
        left: z.number().optional(),
        default_card_type_id: id.optional(),
        first_image_is_cover: z.boolean().optional(),
        reset_lane_spent_time: z.boolean().optional(),
        automove_cards: z.boolean().optional(),
        backward_moves_enabled: z.boolean().optional(),
        auto_assign_enabled: z.boolean().optional(),
        sort_order: z.number().optional(),
        external_id: z.union([z.string(), z.number()]).nullable().optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.spaceBoards.createNewBoard(
        args.space_id,
        args.body as Parameters<typeof client.spaceBoards.createNewBoard>[1],
        options,
      ),
    }),
  );
  registry.add(
    'spaceBoards.getBoard',
    'Get board (spaceBoards); full API fields and JSON response.',
    z.strictObject({space_id: id, id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.spaceBoards.getBoard(
        args.space_id,
        args.id,
        options,
      ),
    }),
  );
  registry.add(
    'spaceBoards.getListOfBoards',
    'Get list of boards (spaceBoards); full API fields and JSON response.',
    z.strictObject({space_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.spaceBoards.getListOfBoards(args.space_id, options),
    }),
  );
  registry.add(
    'spaceBoards.removeBoard',
    'Remove board (spaceBoards); full API fields and JSON response.',
    z.strictObject({space_id: id, id: id, force: z.boolean().optional()}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.spaceBoards.removeBoard(
        args.space_id,
        args.id,
        args.force,
        options,
      ),
    }),
  );
  registry.add(
    'spaceBoards.updateBoard',
    'Update board (spaceBoards); full API fields and JSON response.',
    z.strictObject({
      space_id: id,
      id: id,
      body: z
        .strictObject({
          title: z.union([z.string(), z.number()]).optional(),
          description: z.string().nullable().optional(),
          top: z.number().optional(),
          left: z.number().optional(),
          type: z.union([z.literal(1), z.literal(5)]).optional(),
          cell_wip_limits: z.array(z.json()).optional(),
          default_card_type_id: id.optional(),
          default_tags: z.string().nullable().optional(),
          first_image_is_cover: z.boolean().optional(),
          reset_lane_spent_time: z.boolean().optional(),
          automove_cards: z.boolean().optional(),
          backward_moves_enabled: z.boolean().optional(),
          move_parents_to_done: z.boolean().optional(),
          hide_done_policies: z.boolean().optional(),
          hide_done_policies_in_done_column: z.boolean().optional(),
          sort_order: z.number().optional(),
          external_id: z.union([z.string(), z.number()]).nullable().optional(),
          move_from_space_id: id.optional(),
          auto_assign_enabled: z.boolean().optional(),
          card_properties: z
            .array(
              z.strictObject({
                key: z.string().optional(),
                required: z.boolean().optional(),
                laneIds: z.array(z.json()).nullable().optional(),
                columnIds: z.array(z.json()).nullable().optional(),
                cardTypeIds: z.array(z.json()).nullable().optional(),
              }),
            )
            .nullable()
            .optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.spaceBoards.updateBoard(
        args.space_id,
        args.id,
        args.body as Parameters<typeof client.spaceBoards.updateBoard>[2],
        options,
      ),
    }),
  );
  registry.add(
    'spaces.createNewSpace',
    'Create new space (spaces); full API fields and JSON response.',
    z.strictObject({
      body: z.strictObject({
        title: z.union([z.string(), z.number()]),
        external_id: z.union([z.string(), z.number()]).nullable().optional(),
        parent_entity_uid: text.optional(),
        for_everyone_access_role_id: text.optional(),
        sort_order: z.number().optional(),
        work_calendar_id: text.optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.spaces.createNewSpace(
        args.body as Parameters<typeof client.spaces.createNewSpace>[0],
        options,
      ),
    }),
  );
  registry.add(
    'spaces.removeSpace',
    'Remove space (spaces); full API fields and JSON response.',
    z.strictObject({space_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.spaces.removeSpace(args.space_id, options),
    }),
  );
  registry.add(
    'spaces.retrieveListOfSpaces',
    'Retrieve list of spaces (spaces); full API fields and JSON response.',
    z.strictObject({
      limit: pageFields.limit.removeDefault().optional(),
      offset: pageFields.offset.removeDefault().optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.spaces.retrieveListOfSpaces(
        args.limit,
        args.offset,
        options,
      ),
    }),
  );
  registry.add(
    'spaces.retrieveSpace',
    'Retrieve space (spaces); full API fields and JSON response.',
    z.strictObject({space_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.spaces.retrieveSpace(args.space_id, options),
    }),
  );
  registry.add(
    'spaces.updateSpace',
    'Update space (spaces); full API fields and JSON response.',
    z.strictObject({
      space_id: id,
      body: z
        .strictObject({
          title: z.union([z.string(), z.number()]).optional(),
          external_id: z.union([z.string(), z.number()]).nullable().optional(),
          hidden_card_type_uids: z.array(text).optional(),
          settings: z.record(z.string(), z.json()).optional(),
          access: z
            .union([z.literal('for_everyone'), z.literal('by_invite')])
            .optional(),
          parent_entity_uid: text.nullable().optional(),
          sort_order: z.number().optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.spaces.updateSpace(
        args.space_id,
        args.body as Parameters<typeof client.spaces.updateSpace>[1],
        options,
      ),
    }),
  );
  registry.add(
    'subcolumn.createNewSubcolumn',
    'Create new subcolumn (subcolumn); full API fields and JSON response.',
    z.strictObject({
      column_id: id,
      body: z.strictObject({
        external_id: z.union([z.string(), z.number()]).nullable().optional(),
        title: z.string(),
        sort_order: z.number().optional(),
        type: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
        archive_after_days: z.number().optional(),
        months_to_hide_cards: z.number().nullable().optional(),
        card_hide_after_days: z.number().nullable().optional(),
        col_count: z.number().optional(),
        rules: z.number().optional(),
        last_moved_warning_after_minutes: z.number().optional(),
        last_moved_warning_after_hours: z.number().optional(),
        last_moved_warning_after_days: z.number().optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.subcolumn.createNewSubcolumn(
        args.column_id,
        args.body as Parameters<typeof client.subcolumn.createNewSubcolumn>[1],
        options,
      ),
    }),
  );
  registry.add(
    'subcolumn.getListOfSubcolumns',
    'Get list of subcolumns (subcolumn); full API fields and JSON response.',
    z.strictObject({column_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.subcolumn.getListOfSubcolumns(
        args.column_id,
        options,
      ),
    }),
  );
  registry.add(
    'subcolumn.removeSubcolumn',
    'Remove subcolumn (subcolumn); full API fields and JSON response.',
    z.strictObject({
      column_id: id,
      subcolumn_id: id,
      force: z.boolean().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.subcolumn.removeSubcolumn(
        args.column_id,
        args.subcolumn_id,
        args.force,
        options,
      ),
    }),
  );
  registry.add(
    'subcolumn.updateSubcolumn',
    'Update subcolumn (subcolumn); full API fields and JSON response.',
    z.strictObject({
      column_id: id,
      subcolumn_id: id,
      body: z
        .strictObject({
          external_id: z.union([z.string(), z.number()]).nullable().optional(),
          title: z.string().optional(),
          sort_order: z.number().optional(),
          type: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
          archive_after_days: z.number().optional(),
          months_to_hide_cards: z.number().nullable().optional(),
          card_hide_after_days: z.number().nullable().optional(),
          col_count: z.number().optional(),
          rules: z.number().optional(),
          default_tags: z.string().nullable().optional(),
          last_moved_warning_after_minutes: z.number().optional(),
          last_moved_warning_after_hours: z.number().optional(),
          last_moved_warning_after_days: z.number().optional(),
          prev_column_id: id.nullable().optional(),
          next_column_id: id.nullable().optional(),
          pause_sla: z.boolean().optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.subcolumn.updateSubcolumn(
        args.column_id,
        args.subcolumn_id,
        args.body as Parameters<typeof client.subcolumn.updateSubcolumn>[2],
        options,
      ),
    }),
  );
}
