import type {KaitenClient, OperationOptions} from '@2chevskii/kaiten-client';
import type {
  CallToolResult,
  McpServer,
  ServerContext,
  ToolAnnotations,
} from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import {describeError} from './errors.ts';

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
  name: string;
  description: string;
  input: z.ZodObject;
  output: z.ZodObject;
  execute: (args: unknown, options: OperationOptions) => Promise<unknown>;
}

export class ToolRegistry {
  private groupName = '';
  private readonly groups = new Map<string, Operation[]>();

  group(name: string): void {
    this.groupName = name;
  }

  constructor(
    private readonly server: McpServer,
    readonly client: KaitenClient,
    private readonly timeoutMs: number,
    private readonly shutdownSignal: AbortSignal,
    readonly instructions: string,
  ) {}

  add<Input extends z.ZodObject, Output extends z.ZodObject>(
    name: string,
    description: string,
    input: Input,
    output: Output,
    annotations: ToolAnnotations,
    execute: (
      args: z.output<Input>,
      options: OperationOptions,
    ) => Promise<unknown>,
  ): void {
    const group = `${this.groupName}_${annotations.readOnlyHint ? 'read' : 'write'}`;
    const operations = this.groups.get(group) ?? [];
    operations.push({
      name,
      description,
      input,
      output,
      execute: (args, options) => execute(input.parse(args), options),
    });
    this.groups.set(group, operations);
  }

  register(): void {
    for (const [group, operations] of this.groups) {
      const variants = operations.map(operation =>
        z.strictObject({
          operation: z.literal(operation.name),
          args: operation.input,
        }),
      );
      const request = variants.length === 1 ? variants[0]! : z.union(variants);
      const inputSchema = z.strictObject({request});
      this.server.registerTool(
        `kaiten_${group}`,
        {
          description: `Select request.operation and provide its fields in request.args.\n${operations
            .map(operation => `${operation.name}: ${operation.description}`)
            .join('\n')}`,
          inputSchema,
          outputSchema: z.looseObject({}),
          annotations: group.endsWith('_read') ? read : change,
        },
        async (
          args: unknown,
          context: ServerContext,
        ): Promise<CallToolResult> => {
          const timeout = new AbortController();
          const timer = setTimeout(() => {
            timeout.abort(
              new DOMException('Request timed out.', 'TimeoutError'),
            );
          }, this.timeoutMs);
          timer.unref();
          const signal = AbortSignal.any([
            context.mcpReq.signal,
            this.shutdownSignal,
            timeout.signal,
          ]);
          try {
            signal.throwIfAborted();
            const {request} = inputSchema.parse(args);
            const operation = operations.find(
              item => item.name === request.operation,
            )!;
            const result = await operation.execute(request.args, {signal});
            const structuredContent = operation.output.parse(result);
            return {
              structuredContent,
              content: [
                {type: 'text', text: JSON.stringify(structuredContent)},
              ],
            };
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
}
