import {KaitenHttpError, KaitenResponseError} from '@2chevskii/kaiten-client';

export function describeError(error: unknown, signal: AbortSignal) {
  if (signal.aborted) {
    const timeout =
      signal.reason instanceof Error && signal.reason.name === 'TimeoutError';
    return {
      code: timeout ? 'TIMEOUT' : 'CANCELLED',
      message: timeout ? 'Kaiten request timed out.' : 'Request cancelled.',
    };
  }
  if (error instanceof KaitenHttpError) {
    return {
      code: 'KAITEN_HTTP_ERROR',
      message: `Kaiten returned HTTP ${error.status}.`,
      status: error.status,
    };
  }
  if (error instanceof KaitenResponseError) {
    return {
      code: 'INVALID_KAITEN_RESPONSE',
      message: 'Kaiten returned an invalid response.',
      status: error.status,
    };
  }
  if (error instanceof TypeError && error.message === 'fetch failed') {
    return {code: 'NETWORK_ERROR', message: 'Could not reach Kaiten.'};
  }
  return {
    code: 'INTERNAL_ERROR',
    message: 'The operation could not be completed.',
  };
}
