import * as z from 'zod/v4';

export function entityResult<Schema extends z.ZodType>(schema: Schema) {
  return z.object({item: schema});
}

export function pageResult<Schema extends z.ZodType>(schema: Schema) {
  return z.object({
    items: z.array(schema),
    next_offset: z.number().int().nonnegative().nullable(),
  });
}

export function offsetPage<T>(
  items: T[],
  page: {limit: number; offset: number},
  local = false,
) {
  const selected = local
    ? items.slice(page.offset, page.offset + page.limit)
    : items;
  const hasMore = local
    ? page.offset + selected.length < items.length
    : selected.length === page.limit;
  return {
    items: selected,
    next_offset: hasMore ? page.offset + selected.length : null,
  };
}
