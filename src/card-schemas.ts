import * as z from 'zod/v4';
import {id, pageFields} from './schemas.ts';
import {cardFilter} from './card-filter-schema.ts';

const batchSelectors = {
  board_id: id.optional(),
  column_id: id.optional(),
  lane_id: id.optional(),
  owner_id: id.optional(),
  type_id: id.optional(),
  condition: z.union([z.literal(1), z.literal(2)]).optional(),
};

export const cardBatchBody = z
  .strictObject({
    ...batchSelectors,
    attributes: z
      .strictObject({
        ...batchSelectors,
        title: z.union([z.string(), z.number()]).optional(),
        asap: z.boolean().optional(),
        due_date: z.string().nullable().optional(),
        due_date_time_present: z.boolean().optional(),
        sort_order: z.number().optional(),
        description: z.union([z.string(), z.number()]).nullable().optional(),
        expires_later: z.boolean().optional(),
        size_text: z.union([z.string(), z.number()]).nullable().optional(),
        service_id: id.nullable().optional(),
        blocked: z.boolean().optional(),
        external_id: z.union([z.string(), z.number()]).nullable().optional(),
      })
      .optional(),
    order_by: z
      .strictObject({
        field_type: z
          .enum(['cp', 'size', 'created', 'due_date', 'title'])
          .optional(),
        id: id.optional(),
        direction: z.enum(['asc', 'desc']).optional(),
      })
      .optional(),
  })
  .refine(value => {
    const selected = Object.keys(batchSelectors).some(
      key => value[key as keyof typeof batchSelectors] !== undefined,
    );
    return (
      (selected && value.attributes !== undefined) ||
      (value.column_id !== undefined &&
        value.lane_id !== undefined &&
        value.order_by !== undefined)
    );
  }, 'Supply a selector and attributes, or column_id, lane_id and order_by.');

export const cardCreateBody = z.strictObject({
  title: z.union([z.string(), z.number()]),
  board_id: id,
  asap: z.boolean().optional(),
  due_date: z.string().nullable().optional(),
  due_date_time_present: z.boolean().optional(),
  sort_order: z.number().optional(),
  description: z.union([z.string(), z.number()]).nullable().optional(),
  expires_later: z.boolean().optional(),
  size_text: z.union([z.string(), z.number()]).nullable().optional(),
  column_id: id.optional(),
  lane_id: id.optional(),
  owner_id: id.optional(),
  responsible_id: id.optional(),
  owner_email: z.string().optional(),
  position: z.union([z.literal(1), z.literal(2)]).optional(),
  type_id: id.optional(),
  service_id: id.nullable().optional(),
  external_id: z.union([z.string(), z.number()]).nullable().optional(),
  text_format_type_id: z
    .union([z.literal(1), z.literal(2), z.literal(3)])
    .optional(),
  properties: z.record(z.string(), z.json()).optional(),
});

export const cardSearchQuery = z.strictObject({
  created_before: z.string().optional(),
  created_after: z.string().optional(),
  updated_before: z.string().optional(),
  updated_after: z.string().optional(),
  first_moved_in_progress_after: z.string().optional(),
  first_moved_in_progress_before: z.string().optional(),
  last_moved_to_done_at_after: z.string().optional(),
  last_moved_to_done_at_before: z.string().optional(),
  due_date_after: z.string().optional(),
  due_date_before: z.string().optional(),
  query: z.string().optional(),
  version: z.union([z.literal(1), z.literal(2)]).optional(),
  tag: z.string().optional(),
  tag_ids: z.union([z.string(), z.array(id)]).optional(),
  type_ids: z.union([z.string(), z.array(id)]).optional(),
  exclude_board_ids: z.union([z.string(), z.array(id)]).optional(),
  exclude_lane_ids: z.union([z.string(), z.array(id)]).optional(),
  exclude_column_ids: z.union([z.string(), z.array(id)]).optional(),
  column_ids: z.union([z.string(), z.array(id)]).optional(),
  member_ids: z.union([z.string(), z.array(id)]).optional(),
  owner_ids: z.union([z.string(), z.array(id)]).optional(),
  responsible_ids: z.union([z.string(), z.array(id)]).optional(),
  states: z
    .union([
      z.string(),
      z.array(z.union([z.literal(1), z.literal(2), z.literal(3)])),
    ])
    .optional(),
  external_id: z.string().optional(),
  additional_card_fields: z
    .union([z.string(), z.array(z.literal('description'))])
    .optional(),
  search_fields: z.string().optional(),
  space_id: id.optional(),
  limit: pageFields.limit.removeDefault().optional(),
  offset: pageFields.offset.removeDefault().optional(),
  start_position: z.string().optional(),
  include_search_preview: z.boolean().optional(),
  order_space_id: id.optional(),
  board_id: id.optional(),
  column_id: id.optional(),
  lane_id: id.optional(),
  condition: z.number().optional(),
  type_id: id.optional(),
  responsible_id: id.optional(),
  owner_id: id.optional(),
  archived: z.boolean().optional(),
  asap: z.boolean().optional(),
  overdue: z.boolean().optional(),
  done_on_time: z.boolean().optional(),
  with_due_date: z.boolean().optional(),
  filter: z.union([z.string(), cardFilter]).optional(),
  order_by: z.union([z.string(), z.array(z.string())]).optional(),
  order_direction: z
    .union([
      z.string(),
      z.array(z.union([z.literal('asc'), z.literal('desc')])),
    ])
    .optional(),
  is_request: z.boolean().optional(),
  exclude_owner_ids: z.union([z.string(), z.array(id)]).optional(),
  exclude_card_ids: z.union([z.string(), z.array(id)]).optional(),
  organizations_ids: z.union([z.string(), z.array(id)]).optional(),
  broken_api: z.boolean().optional(),
});

export const cardUpdateBody = z.strictObject({
  title: z.union([z.string(), z.number()]).optional(),
  asap: z.boolean().optional(),
  due_date: z.string().nullable().optional(),
  due_date_time_present: z.boolean().optional(),
  sort_order: z.number().optional(),
  description: z.union([z.string(), z.number()]).nullable().optional(),
  expires_later: z.boolean().optional(),
  size_text: z.union([z.string(), z.number()]).nullable().optional(),
  board_id: id.optional(),
  column_id: id.optional(),
  lane_id: id.optional(),
  owner_id: id.optional(),
  type_id: id.optional(),
  service_id: id.nullable().optional(),
  blocked: z.boolean().optional(),
  condition: z.union([z.literal(1), z.literal(2)]).optional(),
  external_id: z.union([z.string(), z.number()]).nullable().optional(),
  text_format_type_id: z
    .union([z.literal(1), z.literal(2), z.literal(3)])
    .optional(),
  sd_new_comment: z.boolean().optional(),
  owner_email: z.string().optional(),
  prev_card_id: id.optional(),
  estimate_workload: z.number().optional(),
  ignore_planned_dates_recalculation: z.boolean().optional(),
  properties: z.record(z.string(), z.json()).optional(),
});
