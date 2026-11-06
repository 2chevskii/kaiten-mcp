# Files and comment attachments

File reads and downloads use `kaiten_files_read`; uploads, metadata changes and
deletion use `kaiten_files_write`. The server exposes exactly **20 tools**.
All Kaiten API requests use public methods of the pinned client **1.1.0**.

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
`get_legacy_card_file` accepts `card_id` and numeric `file_id`, returning
`{result: metadata}` or `FILE_NOT_FOUND` with status 404.

## Public client operations

These operations return complete native JSON in `{result}`. Use `_read` for
`get*` operations and `_write` for attach/update/delete/detach.

| Resource                              | Operations after `resource.`                                                                                  | Arguments                                                                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cardFiles` (legacy)                  | `attachFileToCard`, `updateFile`, `detachFileFromCard`                                                        | `card_id`; `file` for attach; numeric `file_id` for update/detach; optional `card_cover` for update                                                            |
| `restrictedAccessCardFiles`           | `attachFileToCard`, `getCardFile`, `updateCardFile`, `deleteCardFile`                                         | `card_uid`; `file` for attach; `file_uid` otherwise; optional `redirect`, `download` for get; optional `name`, `card_cover` for update                         |
| `restrictedAccessCommentFiles`        | `attachFileToComment`, `getCommentFile`, `updateCommentFile`, `deleteCommentFile`                             | `card_uid`, `comment_uid`; `file` for attach; `file_uid` otherwise; optional `query: {redirect?, download?}` for get; `body: {name?, card_cover?}` for update  |
| `restrictedAccessCustomPropertyFiles` | `attachFileToCustomProperty`, `getCustomPropertyFile`, `updateCustomPropertyFile`, `deleteCustomPropertyFile` | `card_uid`, `property_uid`; `file` for attach; `file_uid` otherwise; optional `query: {redirect?, download?}` for get; `body: {name?, card_cover?}` for update |

All restricted identifiers are UUID strings. Metadata gets can include a
temporary signed URL. A get with `redirect: true` returns `{result: {location}}`
without following it. Request signed links immediately before use and keep
them private. The byte-download helpers below avoid returning the storage URL.

Restricted routes require the company's restricted-file-access setting.
Legacy numeric-ID upload and comment multipart upload are deprecated and may
be disabled by Kaiten; there is no automatic fallback between route families.
Kaiten's installation limit can reject an upload with HTTP 413, independently
of the MCP limit. See the [restricted upload reference](https://developers.kaiten.ru/restricted-access-card-files/attach-file-to-card).

## Upload bytes

The `file` argument contains `data_base64`, optional `filename` and optional
`mime_type`. Base64 must be canonical and padded, with no whitespace or data URL
prefix. `""` uploads an empty file. Filename defaults to `file`, MIME type to
`application/octet-stream`. The server converts bytes to a `Blob`; the public
client builds multipart boundaries and headers. No local file path is accepted.

Upload a three-byte text file through `kaiten_files_write`:

```json
{
  "request": {
    "operation": "restrictedAccessCardFiles.attachFileToCard",
    "args": {
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

| Operation in `kaiten_files_read` | Arguments                              |
| -------------------------------- | -------------------------------------- |
| `download_card_file`             | `card_uid`, `file_uid`                 |
| `download_comment_file`          | `card_uid`, `comment_uid`, `file_uid`  |
| `download_custom_property_file`  | `card_uid`, `property_uid`, `file_uid` |
| `download_legacy_card_file`      | Numeric `card_id`, `file_id`           |

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
    "operation": "cardComments.addComment",
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

For restricted files, create the comment first, then use its UUID with
`restrictedAccessCommentFiles.attachFileToComment`.
The pinned client's comment read has no server pagination arguments.
[Kaiten caps this endpoint at 100 comments](https://developers.kaiten.ru/card-comments/retrieve-card-comments),
so advanced reads expose the returned page and convenient `list_comments` can
only page locally within it. Neither operation promises a complete history.

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
