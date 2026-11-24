import * as z from 'zod/v4';
import {commentForm, multipartForm} from '../file-transfer.ts';
import {apiResult} from '../results.ts';
import {defined, id} from '../schemas.ts';
import {change, type ToolRegistry} from '../tool-registry.ts';

const exactlyOneBody = (args: {body?: unknown; form?: unknown}) =>
  (args.body === undefined) !== (args.form === undefined);

export function registerAdvancedComments(
  registry: ToolRegistry,
  maximum: number,
): void {
  const {cardComments} = registry.client;
  registry.add(
    'cardComments.addComment',
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
