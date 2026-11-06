import type {JsonValue} from '@2chevskii/kaiten-client';
import * as z from 'zod/v4';
import {defined, uuid} from './schemas.ts';

const presence = ['known', 'unknown'];
const equality = ['eq', 'ne', ...presence];
const textComparisons = [
  ...equality,
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
];

const directoryFilter = z
  .strictObject({
    fieldId: uuid,
    fieldType: z.enum([
      'string',
      'number',
      'date',
      'email',
      'url',
      'phone',
      'checkbox',
      'select',
      'user',
      'catalog',
      'directory_link',
      'file',
    ]),
    comparison: z.enum([
      'eq',
      'ne',
      'contains',
      'not_contains',
      'starts_with',
      'ends_with',
      'known',
      'unknown',
      'gt',
      'lt',
      'true',
      'false',
    ]),
    value: z.json().optional(),
    searchByDisplayValue: z.boolean().optional(),
  })
  .refine(filter => {
    let supported: string[];
    switch (filter.fieldType) {
      case 'number':
      case 'date':
        supported = [...equality, 'gt', 'lt'];
        break;
      case 'checkbox':
        supported = ['true', 'false'];
        break;
      case 'file':
        supported = presence;
        break;
      case 'select':
      case 'user':
      case 'catalog':
        supported = filter.searchByDisplayValue
          ? [...equality, 'contains']
          : equality;
        break;
      case 'directory_link':
        supported = equality;
        break;
      default:
        supported = textComparisons;
    }
    return supported.includes(filter.comparison);
  }, 'Unsupported comparison for this directory field type.')
  .refine(
    filter =>
      [...presence, 'true', 'false'].includes(filter.comparison) ||
      (filter.value !== undefined && filter.value !== null),
    'Supply a value for this comparison.',
  );

export const directoryFilters = z.union([
  z.array(directoryFilter),
  z.record(z.string().regex(/^(0|[1-9]\d*)$/), directoryFilter),
]);

/** Convert the typed filters into the nested query encoding required by Kaiten. */
export function encodeDirectoryFilters(
  filters: z.output<typeof directoryFilters> | undefined,
) {
  const query: Record<string, string | number | boolean> = {};
  function visit(value: JsonValue | undefined, path: string): void {
    if (value === null || value === undefined) return;
    if (typeof value === 'object') {
      for (const [key, item] of Object.entries(value))
        visit(item, `${path}[${key}]`);
    } else query[path] = value;
  }
  for (const [index, filter] of Object.entries(filters ?? {}))
    visit(defined(filter), `filters[${index}]`);
  return query;
}
