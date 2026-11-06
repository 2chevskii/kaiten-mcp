import * as z from 'zod/v4';
import {OperationError} from './errors.ts';
import {ToolResponse} from './results.ts';
import {text} from './schemas.ts';
import {isHttpsOrLoopbackUrl} from './urls.ts';

export const defaultMaxFileBytes = 5 * 1024 * 1024;
export const fileUpload = z.strictObject({
  data_base64: z
    .string()
    .describe(
      'Canonical padded base64, without a data URL prefix; empty files are allowed.',
    ),
  filename: text.optional(),
  mime_type: z
    .string()
    .min(1)
    .regex(/^[\x20-\x7e]+$/)
    .optional(),
});
export const multipartForm = z.array(
  z.union([
    z.strictObject({name: text, value: z.string()}),
    z.strictObject({name: text, file: fileUpload}),
  ]),
);
export const downloadResult = z.strictObject({
  file: z.strictObject({
    uri: z.string(),
    mime_type: z.string(),
    size_bytes: z.number().int().nonnegative(),
  }),
});

function tooLarge(): never {
  throw new OperationError(
    'FILE_TOO_LARGE',
    'File bytes exceed KAITEN_MAX_FILE_BYTES.',
  );
}

export function uploadBlob(
  file: z.output<typeof fileUpload>,
  maximum: number,
): Blob {
  if (file.data_base64.length > Math.ceil(maximum / 3) * 4) tooLarge();
  const bytes = Buffer.from(file.data_base64, 'base64');
  if (bytes.toString('base64') !== file.data_base64) {
    throw new OperationError(
      'INVALID_FILE_DATA',
      'Expected canonical padded base64 file data.',
    );
  }
  if (bytes.length > maximum) tooLarge();
  return new Blob([new Uint8Array(bytes)], {
    type: file.mime_type ?? 'application/octet-stream',
  });
}

/** Preserve FormData ordering, duplicate names, text parts, and binary parts. */
export function commentForm(
  parts: z.output<typeof multipartForm>,
  maximum: number,
): FormData {
  const form = new FormData();
  let bytes = 0;
  for (const part of parts) {
    if ('value' in part) {
      form.append(part.name, part.value);
    } else {
      const blob = uploadBlob(part.file, maximum);
      bytes += blob.size;
      if (bytes > maximum) tooLarge();
      form.append(part.name, blob, part.file.filename ?? 'file');
    }
  }
  return form;
}

function downloadUrl(location: string, base: string): string {
  try {
    if (typeof location !== 'string' || !location) throw new TypeError();
    const url = new URL(location, base).href;
    if (isHttpsOrLoopbackUrl(url)) return url;
  } catch {
    // Report a constant message, never the signed URL.
  }
  throw new OperationError(
    'INVALID_FILE_URL',
    'The file URL must use HTTPS without embedded credentials (HTTP loopback is allowed).',
  );
}

/** Only file bytes use platform fetch; Kaiten API requests use public client methods. */
export async function downloadFile(
  location: string,
  origin: string,
  uri: string,
  maximum: number,
  signal?: AbortSignal,
): Promise<ToolResponse> {
  let url = downloadUrl(location, origin);
  for (let redirects = 0; redirects <= 5; redirects++) {
    signal?.throwIfAborted();
    const response = await fetch(url, {
      signal: signal ?? null,
      redirect: 'manual',
      credentials: 'omit',
    });
    if (response.status >= 300 && response.status < 400) {
      const next = response.headers.get('location');
      await response.body?.cancel();
      if (!next || redirects === 5) {
        throw new OperationError(
          'FILE_DOWNLOAD_REDIRECT_ERROR',
          'The file download returned an invalid redirect chain.',
        );
      }
      url = downloadUrl(next, url);
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new OperationError(
        'FILE_DOWNLOAD_HTTP_ERROR',
        `File storage returned HTTP ${response.status}.`,
        response.status,
      );
    }
    const length = response.headers.get('content-length');
    if (length !== null && /^\d+$/.test(length) && Number(length) > maximum) {
      await response.body?.cancel();
      tooLarge();
    }
    const chunks: Buffer[] = [];
    let size = 0;
    if (response.body) {
      const reader = response.body.getReader();
      try {
        while (true) {
          const {value, done} = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > maximum) tooLarge();
          chunks.push(Buffer.from(value));
        }
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    }
    signal?.throwIfAborted();
    const mimeType =
      response.headers.get('content-type') ?? 'application/octet-stream';
    return new ToolResponse(
      {file: {uri, mime_type: mimeType, size_bytes: size}},
      [
        {
          type: 'resource',
          resource: {
            uri,
            mimeType,
            blob: Buffer.concat(chunks).toString('base64'),
          },
        },
      ],
    );
  }
  throw new OperationError(
    'FILE_DOWNLOAD_REDIRECT_ERROR',
    'The file download returned an invalid redirect chain.',
  );
}
