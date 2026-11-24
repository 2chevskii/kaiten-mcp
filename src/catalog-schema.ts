import type {StandardSchemaWithJSON} from '@modelcontextprotocol/server';
import type * as z from 'zod/v4';

export interface SchemaNode {
  description?: string;
  properties?: Record<string, SchemaNode>;
  items?: SchemaNode;
  anyOf?: SchemaNode[];
  oneOf?: SchemaNode[];
  allOf?: SchemaNode[];
}

export function alternatives(schema: SchemaNode): SchemaNode[] {
  return schema.anyOf ?? schema.oneOf ?? [schema];
}

function fieldsAt(schema: SchemaNode, path: readonly string[]): SchemaNode[] {
  const [key, ...rest] = path;
  if (key === undefined) return [schema];
  const field = schema.properties?.[key];
  if (field) return fieldsAt(field, rest);
  const children = [
    ...(schema.anyOf ?? []),
    ...(schema.oneOf ?? []),
    ...(schema.allOf ?? []),
    ...(schema.items ? [schema.items] : []),
  ];
  return children.flatMap(child => fieldsAt(child, path));
}

export function describeFields(
  schema: SchemaNode,
  descriptions: Readonly<Record<string, string>> = {},
): void {
  for (const [path, description] of Object.entries(descriptions)) {
    const fields = fieldsAt(schema, path.split('.'));
    if (fields.length === 0) {
      throw new Error(`Unknown catalog schema field "${path}".`);
    }
    for (const field of fields) field.description = description;
  }
}

export function documentedSchema(
  schema: z.ZodType,
  io: 'input' | 'output',
  annotate: (json: SchemaNode) => void,
): StandardSchemaWithJSON {
  const standard = schema['~standard'];
  function jsonSchema(
    options: Parameters<typeof standard.jsonSchema.input>[0],
  ) {
    const json = structuredClone(standard.jsonSchema[io](options));
    annotate(json as SchemaNode);
    return json;
  }
  return {
    '~standard': {
      version: 1,
      vendor: 'kaiten-mcp',
      validate(value) {
        if (io === 'output') return standard.validate(value);
        const result = schema.safeParse(value);
        // Keep the original arguments so dispatch can distinguish branches
        // before any defaults are applied.
        return result.success ? {value} : {issues: result.error.issues};
      },
      jsonSchema: {input: jsonSchema, output: jsonSchema},
    },
  };
}
