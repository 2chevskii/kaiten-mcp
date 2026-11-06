import type {KaitenClient, OperationOptions} from '@2chevskii/kaiten-client';
import * as z from 'zod/v4';
import {OperationError} from '../errors.ts';
import {
  downloadFile,
  downloadResult,
  fileUpload,
  uploadBlob,
} from '../file-transfer.ts';
import {apiResult, offsetPage} from '../results.ts';
import {defined, id, pageFields, uuid} from '../schemas.ts';
import {change, read, type ToolRegistry} from '../tool-registry.ts';

const cardKey = {card_uid: uuid, file_uid: uuid};
const commentKey = {...cardKey, comment_uid: uuid};
const propertyKey = {...cardKey, property_uid: uuid};
const redirectQuery = z.strictObject({
  redirect: z.boolean().optional(),
  download: z.boolean().optional(),
});
const updateBody = z.strictObject({
  name: z.string().optional(),
  card_cover: z.boolean().optional(),
});
const cardFileListing = z.looseObject({
  uid: z.string().nullable().optional(),
  files: z.array(z.json()),
});

async function legacyFile(
  client: KaitenClient,
  cardId: number,
  fileId: number,
  options: OperationOptions,
) {
  const card = cardFileListing.parse(
    await client.cards.retrieveCard(cardId, undefined, options),
  );
  const file = card.files.find(
    item =>
      typeof item === 'object' &&
      item !== null &&
      !Array.isArray(item) &&
      item.id === fileId,
  );
  if (!file)
    throw new OperationError(
      'FILE_NOT_FOUND',
      'The file is not attached to this card.',
      404,
    );
  return file;
}

export function registerFiles(
  registry: ToolRegistry,
  maximum: number,
  origin: string,
): void {
  const {client} = registry;
  const {
    cardFiles,
    restrictedAccessCardFiles: cards,
    restrictedAccessCommentFiles: comments,
    restrictedAccessCustomPropertyFiles: properties,
  } = client;
  registry.add(
    'list_card_files',
    'List full card attachment metadata through the public card read, including legacy numeric IDs and restricted UUIDs; pagination is local.',
    z.strictObject({card_id: id, ...pageFields}),
    z.strictObject({
      card_uid: z.string().nullable(),
      items: z.array(z.json()),
      next_offset: z.number().int().nonnegative().nullable(),
    }),
    read,
    async (args, options) => {
      const card = cardFileListing.parse(
        await client.cards.retrieveCard(args.card_id, undefined, options),
      );
      return {
        card_uid: card.uid ?? null,
        ...offsetPage(card.files, args, true),
      };
    },
  );
  registry.add(
    'get_legacy_card_file',
    'Find legacy numeric-ID file metadata in the public card read; missing files return FILE_NOT_FOUND.',
    z.strictObject({card_id: id, file_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await legacyFile(client, args.card_id, args.file_id, options),
    }),
  );
  registry.add(
    'cardFiles.attachFileToCard',
    'Legacy deprecated numeric-ID upload. Decode base64 to Blob and let the public client build multipart/form-data.',
    z.strictObject({card_id: id, file: fileUpload}),
    apiResult,
    change,
    async (args, options) => ({
      result: await cardFiles.attachFileToCard(
        args.card_id,
        uploadBlob(args.file, maximum),
        {...options, filename: args.file.filename},
      ),
    }),
  );
  registry.add(
    'cardFiles.detachFileFromCard',
    'Delete a legacy numeric-ID card attachment.',
    z.strictObject({card_id: id, file_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await cardFiles.detachFileFromCard(
        args.card_id,
        args.file_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardFiles.updateFile',
    'Update the legacy attachment card-cover flag, preserving false and omission.',
    z.strictObject({
      card_id: id,
      file_id: id,
      card_cover: z.boolean().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await cardFiles.updateFile(
        args.card_id,
        args.file_id,
        args.card_cover,
        options,
      ),
    }),
  );
  registry.add(
    'restrictedAccessCardFiles.attachFileToCard',
    'Upload base64 file bytes to a card UUID using the public multipart client method.',
    z.strictObject({card_uid: uuid, file: fileUpload}),
    apiResult,
    change,
    async (args, options) => ({
      result: await cards.attachFileToCard(
        args.card_uid,
        uploadBlob(args.file, maximum),
        {...options, filename: args.file.filename},
      ),
    }),
  );
  registry.add(
    'restrictedAccessCardFiles.getCardFile',
    'Get complete restricted file metadata or a temporary location with redirect=true; this operation does not fetch file bytes.',
    z.strictObject({
      ...cardKey,
      redirect: z.boolean().optional(),
      download: z.boolean().optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await cards.getCardFile(
        args.card_uid,
        args.file_uid,
        args.redirect,
        args.download,
        options,
      ),
    }),
  );
  registry.add(
    'restrictedAccessCardFiles.updateCardFile',
    'Rename a restricted card file or update its card-cover flag.',
    z.strictObject({
      ...cardKey,
      name: z.string().optional(),
      card_cover: z.boolean().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await cards.updateCardFile(
        args.card_uid,
        args.file_uid,
        args.name,
        args.card_cover,
        options,
      ),
    }),
  );
  registry.add(
    'restrictedAccessCardFiles.deleteCardFile',
    'Delete a restricted card file by UUID.',
    z.strictObject(cardKey),
    apiResult,
    change,
    async (args, options) => ({
      result: await cards.deleteCardFile(args.card_uid, args.file_uid, options),
    }),
  );
  registry.add(
    'restrictedAccessCommentFiles.attachFileToComment',
    'Upload base64 file bytes to a comment using card and comment UUIDs.',
    z.strictObject({card_uid: uuid, comment_uid: uuid, file: fileUpload}),
    apiResult,
    change,
    async (args, options) => ({
      result: await comments.attachFileToComment(
        args.card_uid,
        args.comment_uid,
        uploadBlob(args.file, maximum),
        {...options, filename: args.file.filename},
      ),
    }),
  );
  registry.add(
    'restrictedAccessCommentFiles.getCommentFile',
    'Get complete comment-file metadata or a temporary location with query.redirect=true.',
    z.strictObject({...commentKey, query: redirectQuery.optional()}),
    apiResult,
    read,
    async (args, options) => ({
      result: await comments.getCommentFile(
        args.card_uid,
        args.comment_uid,
        args.file_uid,
        args.query ? defined(args.query) : undefined,
        options,
      ),
    }),
  );
  registry.add(
    'restrictedAccessCommentFiles.updateCommentFile',
    'Update comment-file name and card_cover using the native partial body.',
    z.strictObject({...commentKey, body: updateBody}),
    apiResult,
    change,
    async (args, options) => ({
      result: await comments.updateCommentFile(
        args.card_uid,
        args.comment_uid,
        args.file_uid,
        defined(args.body),
        options,
      ),
    }),
  );
  registry.add(
    'restrictedAccessCommentFiles.deleteCommentFile',
    'Delete a restricted comment file by UUID.',
    z.strictObject(commentKey),
    apiResult,
    change,
    async (args, options) => ({
      result: await comments.deleteCommentFile(
        args.card_uid,
        args.comment_uid,
        args.file_uid,
        options,
      ),
    }),
  );
  registry.add(
    'restrictedAccessCustomPropertyFiles.attachFileToCustomProperty',
    'Upload base64 file bytes to a custom property using card and property UUIDs.',
    z.strictObject({card_uid: uuid, property_uid: uuid, file: fileUpload}),
    apiResult,
    change,
    async (args, options) => ({
      result: await properties.attachFileToCustomProperty(
        args.card_uid,
        args.property_uid,
        uploadBlob(args.file, maximum),
        {...options, filename: args.file.filename},
      ),
    }),
  );
  registry.add(
    'restrictedAccessCustomPropertyFiles.getCustomPropertyFile',
    'Get complete custom-property-file metadata or a temporary location with query.redirect=true.',
    z.strictObject({...propertyKey, query: redirectQuery.optional()}),
    apiResult,
    read,
    async (args, options) => ({
      result: await properties.getCustomPropertyFile(
        args.card_uid,
        args.property_uid,
        args.file_uid,
        args.query ? defined(args.query) : undefined,
        options,
      ),
    }),
  );
  registry.add(
    'restrictedAccessCustomPropertyFiles.updateCustomPropertyFile',
    'Update custom-property-file name and card_cover using the native partial body.',
    z.strictObject({...propertyKey, body: updateBody}),
    apiResult,
    change,
    async (args, options) => ({
      result: await properties.updateCustomPropertyFile(
        args.card_uid,
        args.property_uid,
        args.file_uid,
        defined(args.body),
        options,
      ),
    }),
  );
  registry.add(
    'restrictedAccessCustomPropertyFiles.deleteCustomPropertyFile',
    'Delete a restricted custom-property file by UUID.',
    z.strictObject(propertyKey),
    apiResult,
    change,
    async (args, options) => ({
      result: await properties.deleteCustomPropertyFile(
        args.card_uid,
        args.property_uid,
        args.file_uid,
        options,
      ),
    }),
  );
  registry.add(
    'download_card_file',
    'Retrieve a restricted card file as an embedded MCP binary resource, bounded by KAITEN_MAX_FILE_BYTES; never send API credentials to storage.',
    z.strictObject(cardKey),
    downloadResult,
    read,
    async (args, options) => {
      const redirect = await cards.getCardFile(
        args.card_uid,
        args.file_uid,
        true,
        true,
        options,
      );
      return downloadFile(
        redirect.location,
        origin,
        `kaiten-file://cards/${args.card_uid}/${args.file_uid}`,
        maximum,
        options.signal,
      );
    },
  );
  registry.add(
    'download_comment_file',
    'Retrieve a restricted comment file as an embedded MCP binary resource with the configured byte limit.',
    z.strictObject(commentKey),
    downloadResult,
    read,
    async (args, options) => {
      const redirect = await comments.getCommentFile(
        args.card_uid,
        args.comment_uid,
        args.file_uid,
        {redirect: true, download: true},
        options,
      );
      return downloadFile(
        redirect.location,
        origin,
        `kaiten-file://comments/${args.card_uid}/${args.comment_uid}/${args.file_uid}`,
        maximum,
        options.signal,
      );
    },
  );
  registry.add(
    'download_custom_property_file',
    'Retrieve a restricted custom-property file as an embedded MCP binary resource with the configured byte limit.',
    z.strictObject(propertyKey),
    downloadResult,
    read,
    async (args, options) => {
      const redirect = await properties.getCustomPropertyFile(
        args.card_uid,
        args.property_uid,
        args.file_uid,
        {redirect: true, download: true},
        options,
      );
      return downloadFile(
        redirect.location,
        origin,
        `kaiten-file://custom-properties/${args.card_uid}/${args.property_uid}/${args.file_uid}`,
        maximum,
        options.signal,
      );
    },
  );
  registry.add(
    'download_legacy_card_file',
    'Find a legacy numeric-ID attachment through the public card read and return its public URL bytes as an embedded MCP binary resource.',
    z.strictObject({card_id: id, file_id: id}),
    downloadResult,
    read,
    async (args, options) => {
      const file = z
        .looseObject({url: z.string()})
        .parse(await legacyFile(client, args.card_id, args.file_id, options));
      return downloadFile(
        file.url,
        origin,
        `kaiten-file://legacy/${args.card_id}/${args.file_id}`,
        maximum,
        options.signal,
      );
    },
  );
}
