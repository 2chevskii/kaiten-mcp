import * as z from 'zod/v4';
import {id, pageFields, text} from '../schemas.ts';
import {entityResult, offsetPage, pageResult} from '../results.ts';
import {change, create, read, type ToolRegistry} from '../tool-registry.ts';
import {commentView, identityView} from '../views.ts';

export function registerComments(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'list_comments',
    'Read card comments. Full comment text is preserved; pagination is applied locally.',
    z.strictObject({card_id: id, ...pageFields}),
    pageResult(commentView),
    read,
    async (args, options) =>
      offsetPage(
        await client.cardComments.retrieveCardComments(args.card_id, options),
        args,
        true,
      ),
  );
  registry.add(
    'add_comment',
    'Add a text comment to a card.',
    z.strictObject({card_id: id, text}),
    entityResult(commentView),
    create,
    async (args, options) => ({
      item: await client.cardComments.addComment(
        args.card_id,
        {text: args.text},
        options,
      ),
    }),
  );
  registry.add(
    'update_comment',
    'Replace the text of an existing comment.',
    z.strictObject({card_id: id, comment_id: id, text}),
    entityResult(commentView),
    change,
    async (args, options) => ({
      item: await client.cardComments.updateComment(
        args.card_id,
        args.comment_id,
        {text: args.text},
        options,
      ),
    }),
  );
  registry.add(
    'delete_comment',
    'Delete an existing card comment.',
    z.strictObject({card_id: id, comment_id: id}),
    entityResult(identityView),
    change,
    async (args, options) => ({
      item: await client.cardComments.removeComment(
        args.card_id,
        args.comment_id,
        options,
      ),
    }),
  );
}
