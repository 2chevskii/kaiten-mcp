import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import type {TokenProvider} from '@2chevskii/kaiten-client';
import {OperationError} from './errors.ts';

/** Resolve a credential source once, then read file-backed credentials per request. */
export function configuredToken(
  environment: NodeJS.ProcessEnv,
  variable: string,
  fileVariable: string,
  cwd: string,
): TokenProvider | undefined {
  const secret = environment[variable]?.trim();
  const file = environment[fileVariable]?.trim();
  if (environment[fileVariable] !== undefined && !file) {
    throw new Error(`${fileVariable} must name a credential file.`);
  }
  if (secret && file) {
    throw new Error(`Configure only one of ${variable} and ${fileVariable}.`);
  }
  if (file) {
    const path = resolve(cwd, file);
    return async () => {
      try {
        const value = (await readFile(path, 'utf8')).trim();
        if (value) return value;
      } catch {
        // File paths, operating-system errors, and credential content stay private.
      }
      throw new OperationError(
        'CONFIGURATION_ERROR',
        `Could not read a nonempty credential from ${fileVariable}.`,
      );
    };
  }
  if (environment[variable] !== undefined && !secret) {
    throw new Error(`${variable} must be nonempty when configured.`);
  }
  return secret;
}
