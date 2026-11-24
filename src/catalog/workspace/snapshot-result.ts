import * as z from 'zod/v4';

export const snapshotResult = z.object({
  result: z.object({
    items: z
      .array(z.json())
      .describe('Matching records collected across pages.'),
    truncated: z
      .boolean()
      .describe('At least one more matching record exists.'),
  }),
});
