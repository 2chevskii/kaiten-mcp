# Connection options and rotating credentials

`KAITEN_API_VERSION` selects the public client's REST prefix: `v1` (default) or
`latest`. It affects all regular REST calls. SCIM keeps `/scim/v2`; addon OAuth
keeps `/api/v1`, following their public clients. Webhooks use the supplied URL.

Use either `KAITEN_TOKEN` or `KAITEN_TOKEN_FILE` for API credentials. Similarly,
use either `KAITEN_ADDON_SECRET` or `KAITEN_ADDON_SECRET_FILE` for optional addon
OAuth credentials. Supplying both nonempty sources for a credential is an
error. File path variables must be nonempty. Static values are trimmed.

Credential files contain plain UTF-8 tokens with optional surrounding whitespace.
Relative paths resolve against the server's working directory at startup.
The server passes a public `TokenProvider` to the client, reading and trimming
the file before **each HTTP request**. File contents can therefore rotate
without restarting, including between pages of an iterator. Use an atomic file
replacement to avoid requests reading a partially written token. Paths are
configured by the server operator, never supplied as tool arguments.

Files are read lazily. Missing, unreadable or empty files produce a sanitized
`CONFIGURATION_ERROR` before HTTP; after the file is repaired, the next call
can succeed. The path, operating-system error and file contents are omitted from
tool errors and diagnostics. The client applies the operation's cancellation
and timeout while resolving the provider and before sending HTTP.

Example server environment (omit `KAITEN_TOKEN` when using its file source):

```json
{
  "KAITEN_ORIGIN": "https://your-company.kaiten.ru",
  "KAITEN_TOKEN_FILE": "/absolute/path/to/kaiten-token",
  "KAITEN_API_VERSION": "latest"
}
```

On Windows, use an absolute Windows path with JSON backslashes escaped, such as
`C:\\secrets\\kaiten-token`. API version and credential source settings do not
add MCP tools. The total remains 18 tools.
