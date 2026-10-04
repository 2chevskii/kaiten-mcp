import * as z from 'zod/v4';

export const identityView = z.object({id: z.number()});
export const namedView = identityView.extend({
  title: z.string().optional(),
  name: z.string().optional(),
  archived: z.boolean().optional(),
});
export const locationView = namedView.extend({
  board_id: z.number().optional(),
  column_id: z.number().nullable().optional(),
  sort_order: z.number().optional(),
  type: z.number().optional(),
});
export const spaceView = namedView.extend({
  uid: z.string().optional(),
  boards: z.array(namedView).optional(),
});
export const boardView = namedView.extend({
  description: z.string().nullable().optional(),
  columns: z.array(locationView).optional(),
  lanes: z.array(locationView).optional(),
  card_properties: z.json().optional(),
});
export const userView = identityView.extend({
  user_id: z.number().optional(),
  full_name: z.string().optional(),
  email: z.string().optional(),
  username: z.string().optional(),
  type: z.number().optional(),
});
export const tagView = namedView.extend({
  color: z.number().optional(),
  tag_id: z.number().optional(),
});
export const memberRoleView = z.object({
  card_id: z.number(),
  user_id: z.number(),
  type: z.number(),
  created: z.string().optional(),
  updated: z.string().optional(),
});
export const cardSummary = identityView.extend({
  title: z.string(),
  board_id: z.number(),
  column_id: z.number(),
  lane_id: z.number().nullable().optional(),
  state: z.number().optional(),
  condition: z.number().optional(),
  archived: z.boolean().optional(),
  due_date: z.string().nullable().optional(),
  owner_id: z.number().optional(),
  updated: z.string().optional(),
});
export const checklistView = identityView.extend({
  name: z.string().optional(),
  checklist_id: z.number().optional(),
  sort_order: z.number().optional(),
});
export const checklistItemView = identityView.extend({
  text: z.string().nullable().optional(),
  checked: z.boolean().optional(),
  checklist_id: z.number().optional(),
  sort_order: z.number().optional(),
  due_date: z.string().nullable().optional(),
  responsible_id: z.number().nullable().optional(),
});
export const checklistDetails = checklistView.extend({
  items: z.array(checklistItemView),
});
export const cardDetails = cardSummary.extend({
  description: z.string().nullable().optional(),
  asap: z.boolean().optional(),
  size_text: z.string().nullable().optional(),
  type_id: z.number().nullable().optional(),
  board: namedView.optional(),
  column: locationView.optional(),
  lane: locationView.nullable().optional(),
  owner: userView.optional(),
  members: z.array(userView).optional(),
  tags: z.array(tagView).optional(),
  properties: z.record(z.string(), z.json()).nullable().optional(),
  checklists: z.array(checklistView).optional(),
});
export const commentView = identityView.extend({
  text: z.string().optional(),
  author_id: z.number().optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
  deleted: z.boolean().optional(),
});
export const propertyView = identityView.extend({
  name: z.string(),
  type: z.string(),
  condition: z.string().optional(),
  multi_select: z.boolean().optional(),
  protected: z.boolean().optional(),
  values_type: z.string().nullable().optional(),
  data: z.json().optional(),
  fields_settings: z.json().optional(),
});
export const propertyOptionView = identityView.extend({
  value: z.json(),
  condition: z.string().optional(),
  color: z.number().nullable().optional(),
});
export const directoryView = z.object({
  id: z.string(),
  name: z.string().optional(),
  condition: z.string().optional(),
  fields: z.json().optional(),
});
export const directoryRecordView = z.object({
  id: z.string(),
  custom_directory_id: z.string().optional(),
  display_value: z.string().nullable(),
  values: z.array(z.object({field_id: z.string(), value_text: z.string()})),
});
