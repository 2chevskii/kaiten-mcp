import type {DocumentData, DocumentNode} from '@2chevskii/kaiten-client';
import * as z from 'zod/v4';
import {defined, text} from './schemas.ts';

const attributes = z.record(z.string(), z.json());
const documentMark = z
  .strictObject({
    type: text,
    attrs: attributes.optional(),
  })
  .transform(defined);

// Schema-specific node/mark names and attributes are supplied by Kaiten's schema endpoint.
const documentNode: z.ZodType<DocumentNode> = z.lazy(() =>
  z
    .strictObject({
      type: text,
      attrs: attributes.optional(),
      content: z.array(documentNode).optional(),
      marks: z.array(documentMark).optional(),
      text: z.string().optional(),
    })
    .refine(
      node =>
        node.type !== 'text' ||
        (node.text !== undefined && node.text.length > 0),
      'A text node requires nonempty text.',
    )
    .transform(defined),
);

export const documentData: z.ZodType<DocumentData> = z
  .strictObject({
    type: z.literal('doc'),
    content: z.array(documentNode),
    attrs: attributes.optional(),
    marks: z.array(documentMark).optional(),
    text: z.string().optional(),
  })
  .transform(defined);
