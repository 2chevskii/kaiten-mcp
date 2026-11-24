import type * as z from 'zod/v4';

export const catalogDomains = [
  'workspace',
  'cards',
  'collaboration',
  'checklists',
  'custom_properties',
  'content',
  'workflows',
] as const;

export type CatalogToolName =
  `${(typeof catalogDomains)[number]}_${'read' | 'write'}`;
export type ToolProfile = 'canonical' | 'legacy';

type SchemaOverride = z.ZodObject | ((source: z.ZodObject) => z.ZodObject);

export interface CatalogRoute {
  source: string;
  description: string;
  fields?: Readonly<Record<string, string>>;
  input?: SchemaOverride;
  output?: SchemaOverride;
  outputFields?: Readonly<Record<string, string>>;
  mapArgs?: (args: Record<string, unknown>) => unknown;
  replaces?: readonly string[];
}

export interface CatalogTool {
  description: string;
  operations: Readonly<Record<string, CatalogRoute | readonly CatalogRoute[]>>;
}

export type CatalogDefinition = Readonly<
  Partial<Record<CatalogToolName, CatalogTool>>
>;
