import type {KaitenClient, OperationOptions} from '@2chevskii/kaiten-client';
import type {
  CallToolResult,
  McpServer,
  ServerContext,
  StandardSchemaWithJSON,
  ToolAnnotations,
} from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type {CatalogDefinition, CatalogRoute, CatalogTool} from './catalog.ts';
import {
  alternatives,
  describeFields,
  documentedSchema,
} from './catalog-schema.ts';
import {describeError, OperationError} from './errors.ts';
import {ToolResponse} from './results.ts';

export const read: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};
export const create: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
};
export const change: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: true,
};

interface Operation {
  input: z.ZodObject;
  output: z.ZodObject;
  annotations: ToolAnnotations;
  execute: (args: unknown, options: OperationOptions) => Promise<unknown>;
}

interface PreparedRoute {
  operation: Operation;
  route: CatalogRoute;
  input: z.ZodObject;
  output: z.ZodObject;
}

const requestFields = {
  operation: z.string(),
  args: z.record(z.string(), z.unknown()),
};
const requestEnvelope = z.object({request: z.object(requestFields)});

type Request = z.output<typeof requestEnvelope>['request'];

function union<Schema extends z.ZodType>(schemas: readonly Schema[]) {
  if (schemas.length === 0) throw new Error('An MCP schema needs a variant.');
  return schemas.length === 1 ? schemas[0]! : z.union(schemas);
}

function toolInput(variants: readonly z.ZodObject[]) {
  return z.strictObject({request: union(variants)});
}

function resolveSchema(override: CatalogRoute['input'], original: z.ZodObject) {
  return typeof override === 'function'
    ? override(original)
    : (override ?? original);
}

export function operationResult(
  result: unknown,
  output: z.ZodObject,
): CallToolResult {
  const structuredContent = output.parse(
    result instanceof ToolResponse ? result.structuredContent : result,
  );
  return {
    structuredContent,
    content: [
      {type: 'text', text: JSON.stringify(structuredContent)},
      ...(result instanceof ToolResponse ? result.content : []),
    ],
  };
}

export class ToolRegistry {
  private readonly operations = new Map<string, Operation>();

  get sources(): ReadonlyMap<string, Operation> {
    return this.operations;
  }

  constructor(
    private readonly server: McpServer,
    readonly client: KaitenClient,
    private readonly timeoutMs: number,
    private readonly shutdownSignal: AbortSignal,
  ) {}

  add<Input extends z.ZodObject, Output extends z.ZodObject>(
    name: string,
    input: Input,
    output: Output,
    annotations: ToolAnnotations,
    execute: (
      args: z.output<Input>,
      options: OperationOptions,
    ) => Promise<unknown>,
  ): void {
    if (this.operations.has(name)) {
      throw new Error(`Duplicate operation source "${name}".`);
    }
    this.operations.set(name, {
      input,
      output,
      annotations,
      execute: (args, options) => execute(input.parse(args), options),
    });
  }

  register(catalog: CatalogDefinition): void {
    const names = new Set<string>();
    for (const [group, definition] of Object.entries(catalog)) {
      for (const name of Object.keys(definition.operations)) {
        if (!/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(name) || names.has(name)) {
          throw new Error(
            `Invalid or duplicate canonical operation "${name}".`,
          );
        }
        names.add(name);
      }
      this.registerCatalogTool(group, definition);
    }
  }

  private registerCatalogTool(group: string, definition: CatalogTool): void {
    const reads = group.endsWith('_read');
    const groups = new Map<string, PreparedRoute[]>();
    for (const [name, routes] of Object.entries(definition.operations)) {
      const selected: readonly CatalogRoute[] =
        'source' in routes ? [routes] : routes;
      groups.set(
        name,
        selected.map(route => {
          const operation = this.operations.get(route.source);
          if (
            !operation ||
            Boolean(operation.annotations.readOnlyHint) !== reads
          ) {
            throw new Error(
              `Invalid source "${route.source}" for ${group}/${name}.`,
            );
          }
          return {
            operation,
            route,
            input: resolveSchema(route.input, operation.input),
            output: resolveSchema(route.output, operation.output),
          };
        }),
      );
    }

    const variants = Array.from(groups, ([name, routes]) =>
      z.strictObject({
        operation: z
          .literal(name)
          .describe(
            routes.length === 1
              ? routes[0]!.route.description
              : `Choose the ${name} argument form matching your task.`,
          ),
        args: union(routes.map(item => item.input)),
      }),
    );
    const input = documentedSchema(toolInput(variants), 'input', json => {
      const request = json.properties!.request!;
      request.description =
        'Choose an operation, then provide its corresponding args object.';
      const requests = alternatives(request);
      Array.from(groups.values()).forEach((routes, index) => {
        const args = requests[index]!.properties!.args!;
        const argsVariants = routes.length === 1 ? [args] : alternatives(args);
        routes.forEach(({route}, routeIndex) => {
          const variant = argsVariants[routeIndex]!;
          variant.description = route.description;
          describeFields(variant, route.fields);
        });
      });
    });

    const outputs = new Map<z.ZodObject, CatalogRoute['outputFields']>();
    for (const {output, route} of Array.from(groups.values()).flat()) {
      outputs.set(output, {...outputs.get(output), ...route.outputFields});
    }
    const output = documentedSchema(
      union([...outputs.keys()]),
      'output',
      json => {
        const variants = outputs.size === 1 ? [json] : alternatives(json);
        Array.from(outputs.values()).forEach((fields, index) =>
          describeFields(variants[index]!, fields),
        );
      },
    );

    this.registerTool(
      group,
      definition.description,
      input,
      output,
      reads ? read : change,
      async (request, options) => {
        const matches = groups.get(request.operation)!.flatMap(item => {
          const parsed = item.input.safeParse(request.args);
          return parsed.success ? [{item, args: parsed.data}] : [];
        });
        if (matches.length !== 1) {
          throw new OperationError(
            'INVALID_ARGUMENTS',
            'Choose the argument form for exactly one operation variant.',
          );
        }
        const {item, args} = matches[0]!;
        const mapped = item.route.mapArgs ? item.route.mapArgs(args) : args;
        const result = await item.operation.execute(mapped, options);
        const response = operationResult(result, item.operation.output);
        if (item.output !== item.operation.output)
          item.output.parse(response.structuredContent);
        return response;
      },
    );
  }

  registerTool(
    group: string,
    description: string,
    inputSchema: StandardSchemaWithJSON,
    outputSchema: StandardSchemaWithJSON,
    annotations: ToolAnnotations,
    execute: (
      request: Request,
      options: OperationOptions,
    ) => Promise<CallToolResult>,
  ): void {
    this.server.registerTool(
      `kaiten_${group}`,
      {description, inputSchema, outputSchema, annotations},
      async (
        args: unknown,
        context: ServerContext,
      ): Promise<CallToolResult> => {
        const timeout = new AbortController();
        const timer = setTimeout(() => {
          timeout.abort(new DOMException('Request timed out.', 'TimeoutError'));
        }, this.timeoutMs);
        timer.unref();
        const signal = AbortSignal.any([
          context.mcpReq.signal,
          this.shutdownSignal,
          timeout.signal,
        ]);
        try {
          signal.throwIfAborted();
          return await execute(requestEnvelope.parse(args).request, {signal});
        } catch (error) {
          const result = describeError(error, signal);
          return {
            isError: true,
            content: [{type: 'text', text: JSON.stringify(result)}],
          };
        } finally {
          clearTimeout(timer);
        }
      },
    );
  }
}
