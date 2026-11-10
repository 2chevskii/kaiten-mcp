import * as z from 'zod/v4';

// Advertise the integer contract without repeating JS's numeric bounds.
export const id = z
  .number()
  .positive()
  .refine(Number.isSafeInteger, 'Expected a safe integer ID.')
  .meta({type: 'integer'});
export const text = z.string().min(1);
export const userRoleId = z
  .union([z.literal(-1), id])
  .describe('User role ID; -1 is the built-in Employee role.');
export const pageFields = {
  limit: z.number().int().min(1).max(100).default(25),
  offset: z
    .number()
    .nonnegative()
    .refine(Number.isSafeInteger, 'Expected a safe integer offset.')
    .meta({type: 'integer'})
    .default(0),
};
export const pageInput = z.strictObject(pageFields);
export const cardInput = z.strictObject({card_id: id});
const uuidValidator = z.uuid();
export const uuid = z
  .string()
  .refine(value => uuidValidator.safeParse(value).success, 'Expected a UUID.')
  .meta({format: 'uuid'});
const isoDate = z.iso.date();
const isoDateTime = z.iso.datetime({offset: true});
export const dateOnly = z
  .string()
  .refine(value => isoDate.safeParse(value).success, 'Expected an ISO date.')
  .meta({format: 'date'});

// Keep calendar validation at runtime without advertising Zod's large regexes.
export const dateTime = z.union([
  dateOnly,
  z
    .string()
    .refine(
      value => isoDateTime.safeParse(value).success,
      'Expected an ISO date-time with a timezone.',
    )
    .meta({format: 'date-time'}),
]);
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
