import * as z from 'zod/v4';
import {id} from './schemas.ts';

export const cardFilter = z.strictObject({
  key: z.union([z.literal('and'), z.literal('or')]),
  value: z.array(
    z.strictObject({
      key: z.union([z.literal('and'), z.literal('or')]),
      value: z.array(
        z.union([
          z.strictObject({
            key: z.literal('id'),
            comparison: z.union([z.literal('eq'), z.literal('ne')]),
            value: z.number(),
          }),
          z.strictObject({
            key: z.literal('id'),
            comparison: z.union([z.literal('in'), z.literal('not_in')]),
            value: z.array(z.number()),
          }),
          z.strictObject({
            key: z.union([
              z.literal('type_id'),
              z.literal('owner_id'),
              z.literal('state'),
            ]),
            comparison: z.union([z.literal('eq'), z.literal('ne')]),
            value: z.number(),
          }),
          z.strictObject({
            key: z.literal('asap'),
            comparison: z.union([z.literal('true'), z.literal('false')]),
            value: z.never().optional(),
          }),
          z.strictObject({
            key: z.union([
              z.literal('tag'),
              z.literal('responsible'),
              z.literal('member'),
            ]),
            comparison: z.union([z.literal('eq'), z.literal('ne')]),
            value: z.number(),
          }),
          z.strictObject({
            key: z.union([
              z.literal('tag'),
              z.literal('responsible'),
              z.literal('member'),
            ]),
            comparison: z.union([z.literal('known'), z.literal('unknown')]),
            value: z.never().optional(),
          }),
          z.strictObject({
            key: z.union([
              z.literal('created'),
              z.literal('updated'),
              z.literal('last_moved_at'),
            ]),
            comparison: z.union([
              z.literal('eq'),
              z.literal('eq:relative'),
              z.literal('lt:relative'),
              z.literal('today'),
              z.literal('yesterday'),
              z.literal('prev_seven_days'),
              z.literal('prev_thirty_days'),
            ]),
            value: z.strictObject({
              from: z.string(),
              to: z.string(),
            }),
          }),
          z.strictObject({
            key: z.union([
              z.literal('created'),
              z.literal('updated'),
              z.literal('last_moved_at'),
            ]),
            comparison: z.union([
              z.literal('gt'),
              z.literal('lt'),
              z.literal('gt:relative'),
            ]),
            value: z.string(),
          }),
          z.strictObject({
            key: z.union([
              z.literal('first_moved_to_in_progress_at'),
              z.literal('completed_at'),
            ]),
            comparison: z.union([z.literal('known'), z.literal('unknown')]),
            value: z.never().optional(),
          }),
          z.strictObject({
            key: z.union([
              z.literal('first_moved_to_in_progress_at'),
              z.literal('completed_at'),
            ]),
            comparison: z.union([
              z.literal('eq'),
              z.literal('eq:relative'),
              z.literal('lt:relative'),
              z.literal('today'),
              z.literal('yesterday'),
              z.literal('prev_seven_days'),
              z.literal('prev_thirty_days'),
            ]),
            value: z.strictObject({
              from: z.string(),
              to: z.string(),
            }),
          }),
          z.strictObject({
            key: z.union([
              z.literal('first_moved_to_in_progress_at'),
              z.literal('completed_at'),
            ]),
            comparison: z.union([
              z.literal('gt'),
              z.literal('lt'),
              z.literal('gt:relative'),
            ]),
            value: z.string(),
          }),
          z.strictObject({
            key: z.union([
              z.literal('planned_start'),
              z.literal('planned_end'),
            ]),
            comparison: z.union([z.literal('known'), z.literal('unknown')]),
            value: z.never().optional(),
          }),
          z.strictObject({
            key: z.union([
              z.literal('planned_start'),
              z.literal('planned_end'),
            ]),
            comparison: z.union([
              z.literal('eq'),
              z.literal('eq:relative'),
              z.literal('lt:relative'),
              z.literal('today'),
              z.literal('yesterday'),
              z.literal('prev_seven_days'),
              z.literal('prev_thirty_days'),
            ]),
            value: z.strictObject({
              from: z.string(),
              to: z.string(),
            }),
          }),
          z.strictObject({
            key: z.union([
              z.literal('planned_start'),
              z.literal('planned_end'),
            ]),
            comparison: z.union([
              z.literal('gt'),
              z.literal('lt'),
              z.literal('gt:relative'),
            ]),
            value: z.string(),
          }),
          z.strictObject({
            key: z.union([
              z.literal('planned_start'),
              z.literal('planned_end'),
            ]),
            comparison: z.union([
              z.literal('tomorrow'),
              z.literal('next_seven_days'),
              z.literal('next_thirty_days'),
            ]),
            value: z.strictObject({
              from: z.string(),
              to: z.string(),
            }),
          }),
          z.strictObject({
            key: z.literal('due_date'),
            comparison: z.union([z.literal('known'), z.literal('unknown')]),
            value: z.never().optional(),
          }),
          z.strictObject({
            key: z.literal('due_date'),
            comparison: z.union([
              z.literal('eq'),
              z.literal('eq:relative'),
              z.literal('lt:relative'),
              z.literal('today'),
              z.literal('yesterday'),
              z.literal('prev_seven_days'),
              z.literal('prev_thirty_days'),
            ]),
            value: z.strictObject({
              from: z.string(),
              to: z.string(),
            }),
          }),
          z.strictObject({
            key: z.literal('due_date'),
            comparison: z.union([
              z.literal('gt'),
              z.literal('lt'),
              z.literal('gt:relative'),
            ]),
            value: z.string(),
          }),
          z.strictObject({
            key: z.literal('due_date'),
            comparison: z.union([
              z.literal('tomorrow'),
              z.literal('next_seven_days'),
              z.literal('next_thirty_days'),
            ]),
            value: z.strictObject({
              from: z.string(),
              to: z.string(),
            }),
          }),
          z.strictObject({
            key: z.literal('due_date'),
            comparison: z.union([
              z.literal('overdue:custom'),
              z.literal('completed_on_time:custom'),
            ]),
            value: z.never().optional(),
          }),
          z.strictObject({
            key: z.literal('source'),
            comparison: z.union([z.literal('known'), z.literal('unknown')]),
            value: z.never().optional(),
          }),
          z.strictObject({
            key: z.literal('source'),
            comparison: z.union([z.literal('eq'), z.literal('ne')]),
            value: z.union([
              z.literal('email'),
              z.literal('app'),
              z.literal('api'),
              z.literal('telegram'),
              z.literal('max_messenger'),
              z.literal('slack'),
              z.literal('webhook'),
              z.literal('import'),
              z.literal('schedule'),
              z.literal('automation'),
              z.literal('help_center'),
            ]),
          }),
          z.strictObject({
            key: z.literal('partial_path'),
            comparison: z.union([z.literal('eq'), z.literal('ne')]),
            value: z.strictObject({
              id: id,
              type: z.union([
                z.literal('column'),
                z.literal('lane'),
                z.literal('board'),
                z.literal('space'),
              ]),
              spaceId: id.optional(),
              boardId: id.optional(),
              parentId: id.optional(),
            }),
          }),
          z.strictObject({
            key: z.literal('condition'),
            comparison: z.literal('eq'),
            value: z.number(),
          }),
          z.strictObject({
            key: z.literal('time_spent_sum'),
            comparison: z.union([
              z.literal('eq'),
              z.literal('ne'),
              z.literal('gt'),
              z.literal('lt'),
            ]),
            value: z.number(),
          }),
          z.strictObject({
            key: z.literal('custom_property'),
            id: id,
            type: z.union([
              z.literal('string'),
              z.literal('url'),
              z.literal('email'),
              z.literal('phone'),
            ]),
            comparison: z.union([z.literal('known'), z.literal('unknown')]),
            value: z.never().optional(),
          }),
          z.strictObject({
            key: z.literal('custom_property'),
            id: id,
            type: z.union([
              z.literal('string'),
              z.literal('url'),
              z.literal('email'),
              z.literal('phone'),
            ]),
            comparison: z.union([
              z.literal('eq'),
              z.literal('ne'),
              z.literal('starts_with'),
              z.literal('ends_with'),
              z.literal('contains'),
              z.literal('not_contains'),
            ]),
            value: z.string(),
          }),
          z.strictObject({
            key: z.literal('custom_property'),
            id: id,
            type: z.union([
              z.literal('number'),
              z.literal('formula'),
              z.literal('collective_vote'),
            ]),
            comparison: z.union([z.literal('known'), z.literal('unknown')]),
            value: z.never().optional(),
          }),
          z.strictObject({
            key: z.literal('custom_property'),
            id: id,
            type: z.union([
              z.literal('number'),
              z.literal('formula'),
              z.literal('collective_vote'),
            ]),
            comparison: z.union([
              z.literal('eq'),
              z.literal('ne'),
              z.literal('gt'),
              z.literal('lt'),
            ]),
            value: z.string(),
          }),
          z.strictObject({
            key: z.literal('custom_property'),
            id: id,
            type: z.literal('collective_score'),
            comparison: z.union([z.literal('known'), z.literal('unknown')]),
            value: z.never().optional(),
          }),
          z.strictObject({
            key: z.literal('custom_property'),
            id: id,
            type: z.literal('collective_score'),
            comparison: z.union([
              z.literal('eq'),
              z.literal('ne'),
              z.literal('gt'),
              z.literal('lt'),
              z.literal('contains'),
              z.literal('not_contains'),
            ]),
            value: z.string(),
          }),
          z.strictObject({
            key: z.literal('custom_property'),
            id: id,
            type: z.literal('date'),
            comparison: z.union([z.literal('known'), z.literal('unknown')]),
            value: z.never().optional(),
          }),
          z.strictObject({
            key: z.literal('custom_property'),
            id: id,
            type: z.literal('date'),
            comparison: z.union([
              z.literal('gt'),
              z.literal('lt'),
              z.literal('gt:relative'),
            ]),
            value: z.string(),
          }),
          z.strictObject({
            key: z.literal('custom_property'),
            id: id,
            type: z.literal('date'),
            comparison: z.union([
              z.literal('eq'),
              z.literal('eq:relative'),
              z.literal('lt:relative'),
            ]),
            value: z.strictObject({
              from: z.string(),
              to: z.string(),
            }),
          }),
          z.strictObject({
            key: z.literal('custom_property'),
            id: id,
            type: z.literal('checkbox'),
            comparison: z.union([z.literal('true'), z.literal('false')]),
            value: z.null(),
          }),
          z.strictObject({
            key: z.literal('custom_property'),
            id: id,
            type: z.literal('attachment'),
            comparison: z.union([z.literal('known'), z.literal('unknown')]),
            value: z.null(),
          }),
          z.strictObject({
            key: z.literal('custom_property'),
            id: id,
            type: z.union([z.literal('select'), z.literal('catalog')]),
            comparison: z.union([z.literal('eq'), z.literal('ne')]),
            value: z.number(),
          }),
          z.strictObject({
            key: z.literal('custom_property'),
            id: id,
            type: z.union([z.literal('select'), z.literal('catalog')]),
            comparison: z.union([z.literal('known'), z.literal('unknown')]),
            value: z.never().optional(),
          }),
          z.strictObject({
            key: z.literal('custom_property'),
            id: id,
            type: z.union([z.literal('vote'), z.literal('user')]),
            comparison: z.union([z.literal('known'), z.literal('unknown')]),
            value: z.never().optional(),
          }),
          z.strictObject({
            key: z.literal('custom_property'),
            id: id,
            type: z.union([z.literal('vote'), z.literal('user')]),
            comparison: z.union([z.literal('eq'), z.literal('ne')]),
            value: z.string(),
          }),
        ]),
      ),
    }),
  ),
});
