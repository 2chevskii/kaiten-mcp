import {readModelContext, type ModelContext} from './model-context.ts';

export interface Configuration {
  origin: string;
  token: string;
  timeoutMs: number;
  context?: ModelContext;
}

export function readConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): Configuration {
  const origin = environment.KAITEN_ORIGIN?.trim();
  const token = environment.KAITEN_TOKEN?.trim();
  if (!origin || !token) {
    throw new Error(
      'Set KAITEN_ORIGIN and KAITEN_TOKEN before starting Kaiten MCP.',
    );
  }
  const timeoutMs = Number(environment.KAITEN_TIMEOUT_MS ?? 30_000);
  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 2_147_483_647
  ) {
    throw new Error(
      'KAITEN_TIMEOUT_MS must be an integer between 1 and 2147483647.',
    );
  }
  const contextPath = environment.KAITEN_CONTEXT_FILE?.trim();
  if (contextPath === '') {
    throw new Error('KAITEN_CONTEXT_FILE must not be empty.');
  }
  return {
    origin,
    token,
    timeoutMs,
    ...(contextPath === undefined
      ? {}
      : {context: readModelContext(contextPath)}),
  };
}
