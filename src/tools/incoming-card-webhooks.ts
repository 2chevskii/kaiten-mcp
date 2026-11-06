import {sendCardWebhook} from '@2chevskii/kaiten-client/webhooks';
import * as z from 'zod/v4';
import {apiResult} from '../results.ts';
import {id, properties, text} from '../schemas.ts';
import {change, type ToolRegistry} from '../tool-registry.ts';
import {isHttpsOrLoopbackUrl} from '../urls.ts';

export function registerIncomingCardWebhooks(registry: ToolRegistry): void {
  registry.add(
    'sendCardWebhook',
    'Create a card through a configured incoming webhook URL using the public client helper. The Kaiten API token is never sent to the webhook.',
    z.strictObject({
      webhook_url: z
        .string()
        .refine(
          isHttpsOrLoopbackUrl,
          'Expected an HTTPS URL without embedded credentials (HTTP loopback is allowed).',
        ),
      body: z.strictObject({
        title: text,
        description: z.string().optional(),
        asap: z.boolean().optional(),
        due_date: z.string().optional(),
        owner_id: id.optional(),
        links: z
          .array(
            z.strictObject({
              url: z.string(),
              description: z.string().nullable().optional(),
            }),
          )
          .optional(),
        members: z.array(id).optional(),
        tags: z.array(z.string()).optional(),
        properties: properties.optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await sendCardWebhook(
        args.webhook_url,
        args.body as Parameters<typeof sendCardWebhook>[1],
        options,
      ),
    }),
  );
}
