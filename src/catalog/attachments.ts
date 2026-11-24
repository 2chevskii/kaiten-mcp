import * as z from 'zod/v4';
import type {CatalogRoute} from '../catalog.ts';
import {fileUpload} from '../file-transfer.ts';
import {hasChanges, id, uuid} from '../schemas.ts';

const cardUid = uuid.describe(
  'Card UUID returned by list_card_files for the card that owns the attachment.',
);
const cardId = id.describe(
  'Numeric card ID from cards_read. Use this with an existing legacy numeric-ID attachment.',
);
const fileUid = uuid.describe(
  'Restricted attachment UUID from the relevant card, comment or property metadata.',
);
const fileId = id.describe('Legacy numeric attachment ID found on the card.');
const upload = fileUpload.extend({
  filename: fileUpload.shape.filename.describe(
    'Filename to store in Kaiten. Defaults to file.',
  ),
  mime_type: fileUpload.shape.mime_type.describe(
    'MIME type of the bytes. Defaults to application/octet-stream.',
  ),
});
const redirectQuery = z.strictObject({
  redirect: z
    .boolean()
    .optional()
    .describe(
      'Set true to return a fresh signed location instead of metadata. The server does not follow this link.',
    ),
  download: z
    .boolean()
    .optional()
    .describe(
      'Set true to request attachment disposition from storage. It leaves the response as metadata or a location and does not fetch bytes.',
    ),
});
const updateBody = z.strictObject({
  name: z
    .string()
    .optional()
    .describe('Replacement stored filename. Omit to keep the current name.'),
  card_cover: z
    .boolean()
    .optional()
    .describe(
      'Set true to select this file as the card cover or false to clear its cover flag. Omit to keep the current flag.',
    ),
});

const targets = [
  {
    kind: 'card',
    label: 'a restricted file attached to the card itself',
    scope: {card_uid: cardUid},
    fileIdentity: {file_uid: fileUid},
    get: 'restrictedAccessCardFiles.getCardFile',
    download: 'download_card_file',
    attach: 'restrictedAccessCardFiles.attachFileToCard',
    update: 'restrictedAccessCardFiles.updateCardFile',
    remove: 'restrictedAccessCardFiles.deleteCardFile',
  },
  {
    kind: 'comment',
    label: 'a restricted file attached to a card comment',
    scope: {
      card_uid: cardUid,
      comment_uid: uuid.describe(
        'Parent comment UUID from collaboration_read list_comments with format full, or from the create response.',
      ),
    },
    fileIdentity: {file_uid: fileUid},
    get: 'restrictedAccessCommentFiles.getCommentFile',
    download: 'download_comment_file',
    attach: 'restrictedAccessCommentFiles.attachFileToComment',
    update: 'restrictedAccessCommentFiles.updateCommentFile',
    remove: 'restrictedAccessCommentFiles.deleteCommentFile',
  },
  {
    kind: 'property',
    label: 'a restricted file attached to a card custom property',
    scope: {
      card_uid: cardUid,
      property_uid: uuid.describe(
        'Parent custom-property definition UUID. Resolve it with custom_properties_read.',
      ),
    },
    fileIdentity: {file_uid: fileUid},
    get: 'restrictedAccessCustomPropertyFiles.getCustomPropertyFile',
    download: 'download_custom_property_file',
    attach: 'restrictedAccessCustomPropertyFiles.attachFileToCustomProperty',
    update: 'restrictedAccessCustomPropertyFiles.updateCustomPropertyFile',
    remove: 'restrictedAccessCustomPropertyFiles.deleteCustomPropertyFile',
  },
  {
    kind: 'legacy_card',
    label: 'a legacy file with a numeric card attachment ID',
    scope: {card_id: cardId},
    fileIdentity: {file_id: fileId},
    get: 'get_legacy_card_file',
    download: 'download_legacy_card_file',
    attach: 'cardFiles.attachFileToCard',
    update: 'cardFiles.updateFile',
    remove: 'cardFiles.detachFileFromCard',
  },
] as const;

type AttachmentTarget = (typeof targets)[number];

function attachmentRoute(
  target: AttachmentTarget,
  action: 'get' | 'download' | 'attach' | 'update' | 'remove',
  description: string,
  extra: z.ZodRawShape = {},
  mapArgs?: (args: Record<string, unknown>) => unknown,
): CatalogRoute {
  return {
    source: target[action],
    description,
    input: z.strictObject({
      target: z.literal(target.kind).describe(`Select ${target.label}.`),
      ...target.scope,
      ...(action === 'attach' ? {} : target.fileIdentity),
      ...extra,
    }),
    mapArgs: args => {
      const sourceArgs = {...args};
      delete sourceArgs.target;
      return mapArgs ? mapArgs(sourceArgs) : sourceArgs;
    },
  };
}

const metadataResult = z.object({
  result: z.union([
    z.looseObject({
      location: z
        .string()
        .describe('Fresh signed URL when requesting redirect.'),
    }),
    z.looseObject({
      id: z
        .union([id, uuid])
        .describe(
          'Attachment identity. Legacy IDs are numeric; restricted IDs are UUIDs.',
        ),
      url: z
        .string()
        .optional()
        .describe(
          'Temporary restricted URL or legacy public URL, when provided.',
        ),
    }),
  ]),
});

export const attachmentReads: Record<
  string,
  CatalogRoute | readonly CatalogRoute[]
> = {
  list_card_files: {
    source: 'list_card_files',
    description:
      'Find a card’s attachments by numeric card ID. Use the returned card UID and attachment ID to select a metadata or download route. The requested page slices the full card file list locally.',
    fields: {
      card_id: 'Numeric card ID from cards_read.',
      limit:
        'Maximum file records to return from the fetched list. Defaults to 25 and is capped at 100.',
      offset:
        'Zero-based position in the fetched card file list. Reuse next_offset for the next slice.',
    },
    outputFields: {
      card_uid:
        'Card UUID for restricted file calls, or null if Kaiten omits it.',
      items:
        'Attachment metadata including numeric legacy IDs and UUID restricted IDs.',
      next_offset:
        'Next local offset, or null when there are no more attachments in the fetched list.',
    },
  },
  get_attachment: targets.map(target => ({
    ...attachmentRoute(
      target,
      'get',
      target.kind === 'legacy_card'
        ? 'Find a legacy attachment in the card read. An unattached ID gives FILE_NOT_FOUND.'
        : `Read metadata for ${target.label}. Use query.redirect for a short-lived URL instead.`,
      target.kind === 'legacy_card'
        ? {}
        : {
            query: redirectQuery
              .optional()
              .describe('Options for the metadata or signed URL response.'),
          },
      target.kind === 'card'
        ? ({card_uid, file_uid, query}) => ({
            card_uid,
            file_uid,
            ...redirectQuery.optional().parse(query),
          })
        : undefined,
    ),
    output: metadataResult,
  })),
  download_attachment: targets.map(target => ({
    ...attachmentRoute(
      target,
      'download',
      `Return bytes for ${target.label} as an embedded MCP resource.`,
    ),
    outputFields: {
      file: 'An embedded MCP resource also carries the bytes; this object summarizes the transfer.',
      'file.uri': 'Identifier of the accompanying embedded resource.',
      'file.mime_type': 'MIME type determined from storage.',
      'file.size_bytes': 'Number of decoded bytes returned in the resource.',
    },
  })),
};

const legacyUpdate = updateBody
  .pick({card_cover: true})
  .refine(hasChanges, 'Supply card_cover.');
const restrictedUpdate = updateBody.refine(
  hasChanges,
  'Supply name or card_cover.',
);

export const attachmentWrites: Record<
  string,
  CatalogRoute | readonly CatalogRoute[]
> = {
  attach_file: targets.map(target =>
    attachmentRoute(
      target,
      'attach',
      target.kind === 'legacy_card'
        ? 'Use numeric card_id for a deprecated upload only when the Kaiten company still permits it. New uploads should use a restricted UUID route.'
        : `Upload ${target.label}. Resolve the required parent UUIDs first and reuse the returned attachment ID for later updates or deletion.`,
      {
        file: upload.describe(
          'Place canonical padded base64 in data_base64, for example SGk= for two bytes. Omit any data URL prefix. The decoded size is capped by KAITEN_MAX_FILE_BYTES.',
        ),
      },
    ),
  ),
  update_attachment: targets.map(target =>
    attachmentRoute(
      target,
      'update',
      target.kind === 'legacy_card'
        ? 'Set or clear the cover flag of an existing legacy card attachment.'
        : `Rename or set the cover flag on ${target.label}. Omitted fields remain unchanged.`,
      {
        body: (target.kind === 'legacy_card'
          ? legacyUpdate
          : restrictedUpdate
        ).describe('Metadata patch containing at least one supported change.'),
      },
      target.kind === 'card' || target.kind === 'legacy_card'
        ? ({body, ...args}) => ({...args, ...updateBody.parse(body)})
        : undefined,
    ),
  ),
  delete_attachment: targets.map(target =>
    attachmentRoute(
      target,
      'remove',
      `Remove ${target.label} from its parent. There is no attachment restore operation.`,
    ),
  ),
};
