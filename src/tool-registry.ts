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

export class ToolRegistry {
  constructor(
    private readonly server: McpServer,
    readonly client: KaitenClient,
    private readonly timeoutMs: number,
    private readonly shutdownSignal: AbortSignal,
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
    const inputSchema: z.ZodObject = input;
    this.server.registerTool(
      `kaiten_${name}`,
      {
        description,
        inputSchema,
        outputSchema: output,
        annotations,
      },
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
          const result = await execute(input.parse(args), {signal});
          const structuredContent = output.parse(result);
          return {
            structuredContent,
            content: [{type: 'text', text: JSON.stringify(structuredContent)}],
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
