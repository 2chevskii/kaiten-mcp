import * as z from 'zod/v4';

export const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const text = z.string().min(1);
export const pageFields = {
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
};
export const pageInput = z.strictObject(pageFields);
export const cardInput = z.strictObject({card_id: id});
export const dateTime = z.union([z.iso.date(), z.iso.datetime({offset: true})]);
export const properties = z.record(z.string().regex(/^id_[1-9]\d*$/), z.json());

export function hasChanges(value: object): boolean {
  return Object.values(value).some(field => field !== undefined);
}

/** Optional Zod fields allow explicit undefined; Kaiten contracts omit it. */
export function defined<T extends object>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== undefined),
  ) as {[Key in keyof T]: Exclude<T[Key], undefined>};
}
