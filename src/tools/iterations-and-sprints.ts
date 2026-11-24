import * as z from 'zod/v4';
import {id, pageFields, text, uuid} from '../schemas.ts';
import {read, change, type ToolRegistry} from '../tool-registry.ts';
import {apiResult} from '../results.ts';

export function registerIterationsAndSprints(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'iterations.addCardToIteration',
    z.strictObject({space_uid: text, iteration_id: text, card_uid: text}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.iterations.addCardToIteration(
        args.space_uid,
        args.iteration_id,
        args.card_uid,
        options,
      ),
    }),
  );
  registry.add(
    'iterations.addCardsToIteration',
    z.strictObject({
      space_uid: text,
      iteration_id: text,
      card_uids: z
        .array(uuid)
        .min(1)
        .max(500)
        .refine(
          uids => new Set(uids).size === uids.length,
          'Supply unique card UIDs.',
        )
        .meta({uniqueItems: true}),
    }),
    apiResult,
    change,
    async ({space_uid, iteration_id, card_uids}, options) => ({
      result: await client.iterations.addCardsToIteration(
        space_uid,
        iteration_id,
        {card_uids},
        options,
      ),
    }),
  );
  registry.add(
    'iterations.createIteration',
    z.strictObject({
      space_uid: text,
      body: z.strictObject({
        title: z.string(),
        goal: z.string().nullable().optional(),
        start_date: z.string().nullable().optional(),
        finish_date: z.string().nullable().optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.iterations.createIteration(
        args.space_uid,
        args.body as Parameters<typeof client.iterations.createIteration>[1],
        options,
      ),
    }),
  );
  registry.add(
    'iterations.deleteIteration',
    z.strictObject({
      space_uid: text,
      id: text,
      new_iteration_id: text.nullable().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.iterations.deleteIteration(
        args.space_uid,
        args.id,
        args.new_iteration_id,
        options,
      ),
    }),
  );
  registry.add(
    'iterations.getCardIterationsHistory',
    z.strictObject({card_uid: text, with_details: z.boolean().optional()}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.iterations.getCardIterationsHistory(
        args.card_uid,
        args.with_details,
        options,
      ),
    }),
  );
  registry.add(
    'iterations.getIteration',
    z.strictObject({space_uid: text, id: text}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.iterations.getIteration(
        args.space_uid,
        args.id,
        options,
      ),
    }),
  );
  registry.add(
    'iterations.removeCardFromIteration',
    z.strictObject({space_uid: text, iteration_id: text, uid: text}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.iterations.removeCardFromIteration(
        args.space_uid,
        args.iteration_id,
        args.uid,
        options,
      ),
    }),
  );
  registry.add(
    'iterations.removeCardsFromIteration',
    z.strictObject({
      space_uid: text,
      iteration_id: text,
      card_uids: z
        .array(text)
        .min(1)
        .max(500)
        .refine(
          uids => new Set(uids).size === uids.length,
          'Supply unique card UIDs.',
        )
        .meta({uniqueItems: true}),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.iterations.removeCardsFromIteration(
        args.space_uid,
        args.iteration_id,
        {card_uids: args.card_uids},
        options,
      ),
    }),
  );
  registry.add(
    'iterations.retrieveCardsInIteration',
    z.strictObject({
      space_uid: text,
      iteration_id: text,
      status: z.string().optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.iterations.retrieveCardsInIteration(
        args.space_uid,
        args.iteration_id,
        args.status,
        options,
      ),
    }),
  );
  registry.add(
    'iterations.retrieveListOfIterations',
    z.strictObject({
      space_uid: text,
      query: z
        .strictObject({
          status: z.string().optional(),
          with_data: z.string().optional(),
          limit: pageFields.limit.removeDefault().optional(),
          offset: pageFields.offset.removeDefault().optional(),
          order: z.string().optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.iterations.retrieveListOfIterations(
        args.space_uid,
        args.query as Parameters<
          typeof client.iterations.retrieveListOfIterations
        >[1],
        options,
      ),
    }),
  );
  registry.add(
    'iterations.updateIteration',
    z.strictObject({
      space_uid: text,
      id: text,
      body: z
        .strictObject({
          title: z.string().optional(),
          goal: z.string().nullable().optional(),
          status: z
            .union([
              z.literal('active'),
              z.literal('planned'),
              z.literal('closed'),
            ])
            .optional(),
          start_date: z.string().nullable().optional(),
          finish_date: z.string().nullable().optional(),
          actual_finish_date: z.string().nullable().optional(),
          new_iteration_id: text.nullable().optional(),
        })
        .refine(
          value =>
            value['title'] !== undefined ||
            value['goal'] !== undefined ||
            value['status'] !== undefined ||
            value['start_date'] !== undefined ||
            value['finish_date'] !== undefined,
          'Supply at least one of: title, goal, status, start_date, finish_date.',
        ),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.iterations.updateIteration(
        args.space_uid,
        args.id,
        args.body as Parameters<typeof client.iterations.updateIteration>[2],
        options,
      ),
    }),
  );
  registry.add(
    'sprints.getSprintSummary',
    z.strictObject({id: id, exclude_deleted_cards: z.boolean().optional()}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.sprints.getSprintSummary(
        args.id,
        args.exclude_deleted_cards,
        options,
      ),
    }),
  );
  registry.add(
    'sprints.getSprintsList',
    z.strictObject({
      active: z.boolean().optional(),
      limit: pageFields.limit.removeDefault().optional(),
      offset: pageFields.offset.removeDefault().optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.sprints.getSprintsList(
        args.active,
        args.limit,
        args.offset,
        options,
      ),
    }),
  );
}
