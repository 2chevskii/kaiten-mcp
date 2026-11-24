import * as z from 'zod/v4';
import {id, pageFields} from '../schemas.ts';
import {offsetPage, pageResult} from '../results.ts';
import {read, type ToolRegistry} from '../tool-registry.ts';
import {tagView, userView} from '../views.ts';

export function registerCardRelations(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'list_card_members',
    z.strictObject({card_id: id, ...pageFields}),
    pageResult(userView),
    read,
    async (args, options) =>
      offsetPage(
        await client.cardMembers.retrieveListOfCardMembers(
          args.card_id,
          options,
        ),
        args,
        true,
      ),
  );
  registry.add(
    'list_card_tags',
    z.strictObject({card_id: id, ...pageFields}),
    pageResult(tagView),
    read,
    async (args, options) =>
      offsetPage(
        await client.cardTags.rertrieveListOfTags(args.card_id, options),
        args,
        true,
      ),
  );
}
