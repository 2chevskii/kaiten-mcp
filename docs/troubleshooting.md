# Troubleshooting

Start with your MCP client's server status and captured stderr. Diagnostics are
newline-delimited JSON written by Pino to stderr at level `info` by default.
Protocol stdout contains only MCP messages. Startup messages and tool errors
exclude credentials and raw upstream response bodies.

## The client cannot start the server

1. Run `node --version` and confirm Node.js 24 or newer. Ensure Node.js, npm and
   npx are available in your MCP client's PATH.
2. Check the launch arguments against the [setup guide](./guide.md). Include
   `--yes` to suppress installation prompts. On the first launch, npm needs
   access to the configured registry to download the package and dependencies.
3. Check that the client passes `KAITEN_ORIGIN` and `KAITEN_TOKEN` to the server
   process. Variables set in another terminal may be absent from a desktop app.
4. Use an origin such as `https://company.kaiten.ru`, with no `/api/v1` path,
   embedded credentials, query or fragment.
5. Remove an invalid `KAITEN_TIMEOUT_MS` or supply an integer from `1` to
   `2147483647`. An empty string is invalid.

Invalid startup configuration exits with code `1` and a sanitized message naming
these variables. Reload the client's configuration after correcting it.

## The process looks idle in a terminal

The server waits for MCP messages on stdin. It opens no listening port and prints
no startup banner to stdout. Start it through your MCP client and check tool
discovery. It closes when stdin ends, on SIGINT or on SIGTERM; shutdown also
cancels pending HTTP requests.

## The connection works, but a tool fails

Operational failures have `isError: true` and JSON text in `content`, for example:

```json
{
  "code": "KAITEN_HTTP_ERROR",
  "message": "Kaiten returned HTTP 403.",
  "status": 403
}
```

| Code                      | Meaning                                                                  | Next step                                                                                 |
| ------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `KAITEN_HTTP_ERROR`       | Kaiten returned a failed HTTP status                                     | Check the status, token permissions and resource IDs                                      |
| `INVALID_KAITEN_RESPONSE` | Invalid JSON or a response incompatible with the client or server schema | Record the tool name and package versions; report a reproducible case without credentials |
| `NETWORK_ERROR`           | Fetch could not reach Kaiten                                             | Check the company origin and network access from the server's environment                 |
| `TIMEOUT`                 | The operation exceeded `KAITEN_TIMEOUT_MS`                               | Check Kaiten availability; inspect the affected resource before repeating a write         |
| `CANCELLED`               | Cancellation or shutdown aborted the operation                           | Reconnect if needed; inspect the affected resource before repeating a write               |
| `INTERNAL_ERROR`          | An unclassified failure occurred                                         | Record the tool name, package version and sanitized error for an issue                    |

For HTTP errors, useful checks include:

- **401/403:** check the configured token and access to the target space or card.
- **404:** rediscover the resource ID and verify access with the same token.
- **400:** inspect the supplied values, target location and custom-property types.
- **429/5xx:** check upstream availability or rate limiting before trying again.

These are diagnostic checks; the server reports the status and omits Kaiten's
raw error body. It does not automatically retry any request. A failed or cancelled
write may already have reached Kaiten.

## Arguments are rejected before a request

Use the schema returned by MCP `tools/list` and the [tool reference](./tools.md).
Unknown arguments are rejected, IDs must be positive safe integers, and IDs and
booleans must use JSON numbers and booleans. Update `changes` must be nonempty.
Use `YYYY-MM-DD` or an ISO timestamp with a timezone for dates.

For member-role changes, `member_id` is the membership ID from
`kaiten_list_card_members`; `type` accepts only `2`. For property values,
keys must have the form `id_7` and the object passed to
`kaiten_set_card_properties` must contain at least one entry.

## Search results are incomplete or a cursor is rejected

Follow `next_cursor` until it is `null`, retaining your filters. For other lists,
follow `next_offset`. Omitted search filters use Kaiten's defaults; use
`archived: false` explicitly for live cards. Read full descriptions through
`kaiten_get_card`.

Search uses API v1 with `offset:N` cursors. Old OpenSearch cursors cannot continue
it: restart without `cursor`. Local pagination fetches the upstream list again
for each call; it does not cache a snapshot. See [pagination examples](./workflows.md#continue-a-search).

## Report a problem

Include the package version, Node.js version, MCP client name, failing tool and
sanitized error in a [GitHub issue](https://github.com/2chevskii/kaiten-mcp/issues).
Include any fixed package version specified in the npx or npm exec arguments.
Remove tokens and private company data from logs and example arguments.
