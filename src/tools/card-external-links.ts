import * as z from 'zod/v4';
import {defined, hasChanges, id, pageFields} from '../schemas.ts';
import {entityResult, offsetPage, pageResult} from '../results.ts';
import {change, create, read, type ToolRegistry} from '../tool-registry.ts';
import {externalLinkView, identityView} from '../views.ts';

const linkUrl = z.url().max(16_384);
const linkDescription = z.string().max(512).nullable().optional();

export function registerCardExternalLinks(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'list_card_external_links',
    'List native external links on a card, distinct from custom properties. Pagination is applied locally.',
    z.strictObject({card_id: id, ...pageFields}),
    pageResult(externalLinkView),
    read,
    async (args, options) =>
      offsetPage(
        await client.cardExternalLinks.retrieveCardExternalLinks(
          args.card_id,
          options,
        ),
        args,
        true,
      ),
  );
  registry.add(
    'add_card_external_link',
    'Add a native external link to a card.',
    z.strictObject({
      card_id: id,
      url: linkUrl,
      description: linkDescription,
    }),
    entityResult(externalLinkView),
    create,
    async (args, options) => ({
      item: await client.cardExternalLinks.addExternalLink(
        args.card_id,
        args.url,
        args.description,
        options,
      ),
    }),
  );
  registry.add(
    'update_card_external_link',
    'Update a native external link on a card.',
    z.strictObject({
      card_id: id,
      link_id: id,
      changes: z
        .strictObject({
          url: linkUrl.optional(),
          description: linkDescription,
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    entityResult(externalLinkView),
    change,
    async (args, options) => ({
      item: await client.cardExternalLinks.updateExternalLink(
        args.card_id,
        args.link_id,
        defined(args.changes) as {url: string} | {description: string | null},
        options,
      ),
    }),
  );
  registry.add(
    'remove_card_external_link',
    'Remove a native external link from a card.',
    z.strictObject({card_id: id, link_id: id}),
    entityResult(identityView),
    change,
    async (args, options) => ({
      item: await client.cardExternalLinks.removeExternalLink(
        args.card_id,
        args.link_id,
        options,
      ),
    }),
  );
}
