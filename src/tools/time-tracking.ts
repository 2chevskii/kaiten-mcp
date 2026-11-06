import * as z from 'zod/v4';
import {dateOnly, hasChanges, id, pageFields, userRoleId} from '../schemas.ts';
import {read, change, type ToolRegistry} from '../tool-registry.ts';
import {apiResult} from '../results.ts';

export function registerTimeTracking(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'cardTimeLogs.addTimeLog',
    'Add a time log in minutes. role_id accepts -1 for Employee. Returns the full client JSON.',
    z.strictObject({
      card_id: id,
      body: z.strictObject({
        role_id: userRoleId,
        time_spent: z.number(),
        for_date: dateOnly,
        comment: z.string().optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardTimeLogs.addTimeLog(
        args.card_id,
        args.body as Parameters<typeof client.cardTimeLogs.addTimeLog>[1],
        options,
      ),
    }),
  );
  registry.add(
    'cardTimeLogs.getTimeLogs',
    'Get time logs (cardTimeLogs); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      for_date: dateOnly.optional(),
      personal: z.boolean().optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cardTimeLogs.getTimeLogs(
        args.card_id,
        args.for_date,
        args.personal,
        options,
      ),
    }),
  );
  registry.add(
    'cardTimeLogs.removeTimeLog',
    'Remove time log (cardTimeLogs); full API fields and JSON response.',
    z.strictObject({card_id: id, time_log_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardTimeLogs.removeTimeLog(
        args.card_id,
        args.time_log_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardTimeLogs.updateLogRecord',
    'Update log record (cardTimeLogs); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      time_log_id: id,
      body: z
        .strictObject({
          role_id: userRoleId.optional(),
          time_spent: z.number().optional(),
          for_date: dateOnly.optional(),
          comment: z.string().optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardTimeLogs.updateLogRecord(
        args.card_id,
        args.time_log_id,
        args.body as Parameters<typeof client.cardTimeLogs.updateLogRecord>[2],
        options,
      ),
    }),
  );
  registry.add(
    'timesheet.getList',
    'Get list (timesheet); full API fields and JSON response.',
    z.strictObject({
      query: z.strictObject({
        from: dateOnly,
        to: dateOnly,
        tag_ids: z.union([z.string(), z.array(id)]).optional(),
        user_ids: z.union([z.string(), z.array(id)]).optional(),
        group_ids: z.union([z.string(), z.array(id)]).optional(),
        space_ids: z.union([z.string(), z.array(id)]).optional(),
        board_ids: z.union([z.string(), z.array(id)]).optional(),
        column_ids: z.union([z.string(), z.array(id)]).optional(),
        card_ids: z.union([z.string(), z.array(id)]).optional(),
        visible_column_ids: z.union([z.string(), z.array(id)]).optional(),
        limit: z.number().int().min(1).max(200).optional(),
        offset: pageFields.offset.removeDefault().optional(),
        condition: z.number().optional(),
        group_by: z.number().optional(),
        time_precision: z.number().optional(),
        time_unit: z.number().optional(),
        with_daily_distribution: z.number().optional(),
        only_general_sum: z.number().optional(),
      }),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.timesheet.getList(
        args.query as Parameters<typeof client.timesheet.getList>[0],
        options,
      ),
    }),
  );
}
