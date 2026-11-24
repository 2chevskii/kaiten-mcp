import * as z from 'zod/v4';
import {id, pageFields} from '../schemas.ts';
import {offsetPage, pageResult} from '../results.ts';
import {read, type ToolRegistry} from '../tool-registry.ts';
import {externalLinkView} from '../views.ts';
export function registerCardExternalLinks(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'list_card_external_links',
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
}
