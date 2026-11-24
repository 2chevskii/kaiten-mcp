# Files and comment attachments

File reads and downloads use `kaiten_content_read`. Uploads, metadata changes and deletion use `kaiten_content_write`. List attachments first to identify the parent and file IDs. Kaiten API calls use the public client **1.3.0**.

## Discover attachments and identifiers

`list_card_files` accepts numeric `card_id`, optional `limit` (1–100, default 25)
and `offset` (default 0). It calls the public card read and returns
`{card_uid, items, next_offset}` with local pagination and full file metadata.
`card_uid` is `null` if an older response omits it. Missing/invalid `files`
arrays produce `INVALID_KAITEN_RESPONSE`; an empty array is a successful list.

According to [Kaiten's migration guide](https://developers.kaiten.ru/restricted-access-files-migration),
one card can contain legacy attachments with numeric IDs and restricted files
with UUID IDs (`type: 11`). Use the returned card UUID for restricted operations;
comment and property UUIDs come from complete comment/property reads.
`get_attachment` with `target: "legacy_card"` accepts `card_id` and numeric `file_id`, returning
`{result: metadata}` or `FILE_NOT_FOUND` with status 404.

## Attachment operations

Use `get_attachment` for metadata, `download_attachment` for bytes, `attach_file` to upload, `update_attachment` to change metadata and `delete_attachment` to remove a file. Select `target` according to the parent.

| Target        | Required parent IDs        | Existing file ID  |
| ------------- | -------------------------- | ----------------- |
| `card`        | `card_uid`                 | `file_uid`        |
| `comment`     | `card_uid`, `comment_uid`  | `file_uid`        |
| `property`    | `card_uid`, `property_uid` | `file_uid`        |
| `legacy_card` | Numeric `card_id`          | Numeric `file_id` |

For restricted targets, `get_attachment` accepts `query.redirect` for a short-lived private location and `query.download` to request attachment disposition. `update_attachment` takes `body` with `name` or `card_cover`. The `legacy_card` target supports the cover flag. Restricted routes require the company’s restricted-file-access setting. Prefer them for new uploads. Kaiten can disable numeric-ID uploads. Kaiten can reject files with HTTP 413 independently of the MCP size limit.

## Upload bytes

The `file` argument contains `data_base64`, optional `filename` and optional
`mime_type`. Base64 must be canonical and padded, with no whitespace or data URL
prefix. `""` uploads an empty file. Filename defaults to `file`, MIME type to
`application/octet-stream`. The server converts bytes to a `Blob`; the public
client builds multipart boundaries and headers. No local file path is accepted.

Upload a three-byte text file through `kaiten_content_write`:

```json
{
  "request": {
    "operation": "attach_file",
    "args": {
      "target": "card",
      "card_uid": "11111111-1111-4111-8111-111111111111",
      "file": {
        "filename": "note.txt",
        "mime_type": "text/plain",
        "data_base64": "SGkh"
      }
    }
  }
}
```

The response retains the file UUID for metadata, download, update or deletion.

## Download bytes through MCP

Call `download_attachment` in `kaiten_content_read` with the matching `target` and IDs.

Restricted downloads request a temporary redirect through the public client,
then fetch storage bytes with platform `fetch`, without Authorization or cookies.
Legacy downloads find the public URL in the public card response. Downloads
allow HTTPS and HTTP loopback, validate every redirect, follow at most five
storage redirects and share the operation's timeout/cancellation.

`structuredContent` and the first JSON text entry contain only
`{file: {uri, mime_type, size_bytes}}`. A second `content` entry carries the actual
bytes as a standard embedded MCP resource:

```json
{
  "type": "resource",
  "resource": {
    "uri": "kaiten-file://cards/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222",
    "mimeType": "text/plain",
    "blob": "SGkh"
  }
}
```

The MCP host must support embedded binary resources to consume the bytes.
The URI identifies the embedded content; it is not a separate resource-read
endpoint. Bytes are base64 only in `resource.blob`, avoiding duplication in
structured and text output. Downloads stay in memory and do not write local files.

## Comments and FormData

Use `list_comments` in `kaiten_collaboration_read` with `format: "full"` to discover comment UIDs and metadata. Use `next_offset` as `offset` to continue. `add_comment` and `update_comment` take `text` or multipart `form`, and updates also take `comment_id`. `delete_comment` takes `card_id` and `comment_id`.

`cardComments.retrieveCardComments`, `addComment`, `updateComment` and
`removeComment` use the existing comment tools and retain complete JSON,
including comment UUIDs and attachment metadata. Reads take `card_id`; removal
takes numeric `card_id` and `comment_id`. Add takes `card_id` and exactly one of
`body: {text}` or `form`; update also takes `comment_id` and exactly one of
`body: {text?}` or `form`. An empty JSON update is allowed by the client.

`form` is an ordered array of `{name, value}` string parts or `{name, file}`
binary parts using the upload schema. Order and duplicate names are preserved.
For legacy comment uploads, use Kaiten's `files[]` field where supported:

```json
{
  "request": {
    "operation": "add_comment",
    "args": {
      "card_id": 10,
      "form": [
        {"name": "text", "value": "Attached note"},
        {
          "name": "files[]",
          "file": {"filename": "note.txt", "data_base64": "SGkh"}
        }
      ]
    }
  }
}
```

For restricted files, create the comment first. Then use `attach_file` with `target: "comment"`, its `comment_uid`, and the parent `card_uid`.

## Limits and errors

`KAITEN_MAX_FILE_BYTES` defaults to **5,242,880 bytes (5 MiB)** and accepts
integers from 1 to 104,857,600. It caps each upload/download and the sum of binary
parts in one comment form. Base64 and multipart framing increase transport size;
the MCP host may enforce a smaller message limit. Downloads check both declared
Content-Length and actual streamed bytes and cancel excess data.

| Error                                               | Meaning                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| `INVALID_FILE_DATA`                                 | Noncanonical base64; no upload sent                                            |
| `FILE_TOO_LARGE`                                    | Local byte cap exceeded; uploads fail before HTTP                              |
| `FILE_NOT_FOUND` with 404                           | Legacy file is absent from the card                                            |
| `KAITEN_HTTP_ERROR` with 403/404/413                | Kaiten denied access, could not find the entity, or rejected installation size |
| `FILE_DOWNLOAD_HTTP_ERROR` with status              | Storage rejected the signed/public download                                    |
| `INVALID_FILE_URL` / `FILE_DOWNLOAD_REDIRECT_ERROR` | Unsafe URL or invalid/overlong redirect chain                                  |
| `TIMEOUT` / `CANCELLED`                             | Entire operation timed out or was cancelled                                    |

Errors omit signed URLs, credential values and upstream private response bodies.
Writes are not automatically retried. Empty downloads succeed with size zero.
