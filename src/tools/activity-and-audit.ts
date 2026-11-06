import * as z from 'zod/v4';
import {apiResult, collectItems} from '../results.ts';
import {defined, id, text} from '../schemas.ts';
import {read, type ToolRegistry} from '../tool-registry.ts';

const activityFields = {
  limit: id.optional(),
  cursor: z.string().optional(),
  actions: z.string().optional(),
  author_id: id.optional(),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
};
const activityQuery = z.strictObject(activityFields);
const companyQuery = z.strictObject({
  ...activityFields,
  card_id: id.optional(),
});
const maximum = z.number().int().min(1).max(1000).default(100);

export function registerActivityAndAudit(registry: ToolRegistry): void {
  const {activity, auditLogs} = registry.client;
  registry.add(
    'auditLogs.retrieveAuditLogEvents',
    'Retrieve an audit-log page with native filters and complete event details.',
    z.strictObject({
      query: z
        .strictObject({
          from: z.string().optional(),
          to: z.string().optional(),
          author_id: id.optional(),
          author_uid: text.optional(),
          categories: z.string().optional(),
          actions: z.string().optional(),
          id: z.string().optional(),
          limit: id.optional(),
          offset: z
            .number()
            .nonnegative()
            .refine(Number.isSafeInteger)
            .optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await auditLogs.retrieveAuditLogEvents(
        args.query ? defined(args.query) : undefined,
        options,
      ),
    }),
  );
  registry.add(
    'activity.listCompanyActivity',
    'Read company activity with native filters and an opaque next_cursor.',
    z.strictObject({query: companyQuery.optional()}),
    apiResult,
    read,
    async (args, options) => ({
      result: await activity.listCompanyActivity(
        args.query ? defined(args.query) : undefined,
        options,
      ),
    }),
  );
  registry.add(
    'activity.listSpaceActivity',
    'Read space activity with native filters and an opaque next_cursor.',
    z.strictObject({space_id: id, query: activityQuery.optional()}),
    apiResult,
    read,
    async (args, options) => ({
      result: await activity.listSpaceActivity(
        args.space_id,
        args.query ? defined(args.query) : undefined,
        options,
      ),
    }),
  );
  registry.add(
    'activity.iterateCompanyActivity',
    'Collect a bounded company-activity snapshot through the public client iterator; max_items defaults to 100, maximum 1000.',
    z.strictObject({query: companyQuery.optional(), max_items: maximum}),
    apiResult,
    read,
    async (args, options) => ({
      result: await collectItems(
        activity.iterateCompanyActivity(
          args.query ? defined(args.query) : undefined,
          options,
        ),
        args.max_items,
      ),
    }),
  );
  registry.add(
    'activity.iterateSpaceActivity',
    'Collect a bounded space-activity snapshot through the public client iterator; max_items defaults to 100, maximum 1000.',
    z.strictObject({
      space_id: id,
      query: activityQuery.optional(),
      max_items: maximum,
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await collectItems(
        activity.iterateSpaceActivity(
          args.space_id,
          args.query ? defined(args.query) : undefined,
          options,
        ),
        args.max_items,
      ),
    }),
  );
}
