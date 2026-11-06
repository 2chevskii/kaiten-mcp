import * as z from 'zod/v4';
import {commentForm, multipartForm} from '../file-transfer.ts';
import {apiResult} from '../results.ts';
import {defined, id} from '../schemas.ts';
import {change, read, type ToolRegistry} from '../tool-registry.ts';

const exactlyOneBody = (args: {body?: unknown; form?: unknown}) =>
  (args.body === undefined) !== (args.form === undefined);

export function registerAdvancedComments(
  registry: ToolRegistry,
  maximum: number,
): void {
  const {cardComments} = registry.client;
  registry.add(
    'cardComments.retrieveCardComments',
    'Retrieve the complete comment JSON including UUIDs. The public client exposes no server paging parameters; only the upstream default page can be read.',
    z.strictObject({card_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await cardComments.retrieveCardComments(args.card_id, options),
    }),
  );
  registry.add(
    'cardComments.addComment',
    'Add a comment with either native JSON body or portable ordered FormData parts; retain full UUID/attachment response metadata.',
    z
      .strictObject({
        card_id: id,
        body: z.strictObject({text: z.string()}).optional(),
        form: multipartForm.optional(),
      })
      .refine(exactlyOneBody, 'Provide exactly one of body and form.'),
    apiResult,
    change,
    async (args, options) => ({
      result: await cardComments.addComment(
        args.card_id,
        args.form === undefined ? args.body! : commentForm(args.form, maximum),
        options,
      ),
    }),
  );
  registry.add(
    'cardComments.updateComment',
    'Update a comment with either native partial JSON or ordered FormData parts, including legacy file parts where supported.',
    z
      .strictObject({
        card_id: id,
        comment_id: id,
        body: z.strictObject({text: z.string().optional()}).optional(),
        form: multipartForm.optional(),
      })
      .refine(exactlyOneBody, 'Provide exactly one of body and form.'),
    apiResult,
    change,
    async (args, options) => ({
      result: await cardComments.updateComment(
        args.card_id,
        args.comment_id,
        args.form === undefined
          ? defined(args.body!)
          : commentForm(args.form, maximum),
        options,
      ),
    }),
  );
  registry.add(
    'cardComments.removeComment',
    'Delete a comment and preserve the complete native JSON response.',
    z.strictObject({card_id: id, comment_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await cardComments.removeComment(
        args.card_id,
        args.comment_id,
        options,
      ),
    }),
  );
}
