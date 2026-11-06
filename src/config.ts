import {
  readModelContext,
  type ModelContext,
  type ContextLocations,
} from './model-context.ts';
import type {TokenProvider} from '@2chevskii/kaiten-client';
import {configuredToken} from './token-provider.ts';

export interface Configuration {
  origin: string;
  token: TokenProvider;
  timeoutMs: number;
  addonSecret?: TokenProvider;
  apiVersion?: 'v1' | 'latest';
  maxFileBytes?: number;
  context?: ModelContext;
}

export function readConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
  locations?: ContextLocations,
): Configuration {
  const origin = environment.KAITEN_ORIGIN?.trim();
  const token = configuredToken(
    environment,
    'KAITEN_TOKEN',
    'KAITEN_TOKEN_FILE',
    locations?.cwd ?? process.cwd(),
  );
  if (!origin || !token) {
    throw new Error(
      'Set KAITEN_ORIGIN and either KAITEN_TOKEN or KAITEN_TOKEN_FILE before starting Kaiten MCP.',
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
  const context = readModelContext(environment.KAITEN_CONTEXT_FILE, locations);
  const addonSecret = configuredToken(
    environment,
    'KAITEN_ADDON_SECRET',
    'KAITEN_ADDON_SECRET_FILE',
    locations?.cwd ?? process.cwd(),
  );
  const apiVersion = environment.KAITEN_API_VERSION?.trim();
  if (
    apiVersion !== undefined &&
    apiVersion !== 'v1' &&
    apiVersion !== 'latest'
  ) {
    throw new Error('KAITEN_API_VERSION must be v1 or latest.');
  }
  const maxFileBytes =
    environment.KAITEN_MAX_FILE_BYTES === undefined
      ? undefined
      : Number(environment.KAITEN_MAX_FILE_BYTES);
  if (
    maxFileBytes !== undefined &&
    (!Number.isSafeInteger(maxFileBytes) ||
      maxFileBytes < 1 ||
      maxFileBytes > 100 * 1024 * 1024)
  ) {
    throw new Error(
      'KAITEN_MAX_FILE_BYTES must be an integer between 1 and 104857600.',
    );
  }
  return {
    origin,
    token,
    timeoutMs,
    ...(addonSecret === undefined ? {} : {addonSecret}),
    ...(apiVersion === undefined ? {} : {apiVersion}),
    ...(maxFileBytes === undefined ? {} : {maxFileBytes}),
    ...(context === undefined ? {} : {context}),
  };
}
