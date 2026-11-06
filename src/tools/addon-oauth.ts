import type {AddonOAuthClient} from '@2chevskii/kaiten-client/addon-oauth';
import * as z from 'zod/v4';
import {OperationError} from '../errors.ts';
import {apiResult} from '../results.ts';
import {id, text} from '../schemas.ts';
import {change, read, type ToolRegistry} from '../tool-registry.ts';

const tokenKey = z.strictObject({addon_uid: text, user_id: id, company_id: id});

export function registerAddonOAuth(
  registry: ToolRegistry,
  client?: AddonOAuthClient,
): void {
  const requireClient = () => {
    if (!client)
      throw new OperationError(
        'CONFIGURATION_ERROR',
        'Configure KAITEN_ADDON_SECRET to use addon OAuth operations.',
      );
    return client;
  };
  registry.add(
    'addonOAuth.getToken',
    'Retrieve an addon user token with the configured addon secret. The response intentionally contains access_token when present.',
    tokenKey,
    apiResult,
    read,
    async (args, options) => ({
      result: await requireClient().getToken(
        args.addon_uid,
        args.user_id,
        args.company_id,
        options,
      ),
    }),
  );
  registry.add(
    'addonOAuth.refreshToken',
    'Refresh an addon user token with the configured addon secret. The response intentionally contains access_token when present.',
    tokenKey,
    apiResult,
    change,
    async (args, options) => ({
      result: await requireClient().refreshToken(
        args.addon_uid,
        args.user_id,
        args.company_id,
        options,
      ),
    }),
  );
}
