# Addon OAuth

Use `kaiten_workspace_read` to read an addon token and `kaiten_workspace_write` to refresh it. Both calls return sensitive OAuth credentials when available.

| Operation             | Tool                     | Arguments                            |
| --------------------- | ------------------------ | ------------------------------------ |
| `get_addon_token`     | `kaiten_workspace_read`  | `addon_uid`, `user_id`, `company_id` |
| `refresh_addon_token` | `kaiten_workspace_write` | Same token key                       |

Configure `KAITEN_ADDON_SECRET` or `KAITEN_ADDON_SECRET_FILE` in the server environment. See [connection options](./connection-options.md) for rotating file credentials. It authenticates these
two operations against the configured `KAITEN_ORIGIN`; regular REST and SCIM
requests still use `KAITEN_TOKEN` or its file provider. The addon secret cannot be supplied as a tool
argument. A configured secret must be nonempty after trimming. Without it, both
operations remain advertised and return `CONFIGURATION_ERROR` before HTTP.
The usual server connection configuration remains required.

The full response is returned in `{result}`: either `has_token: false` with an
optional `domain`, or `has_token: true` with `access_token`, `expires_at` and an
optional `domain`. Returning the access token is intentional; treat the result
and tool transcript as credentials. The addon secret and upstream error bodies
are never included in errors or diagnostics. Timeout and MCP cancellation
apply; refreshes are not automatically retried.

```json
{
  "request": {
    "operation": "get_addon_token",
    "args": {"addon_uid": "your-addon-uid", "user_id": 5, "company_id": 7}
  }
}
```

The client's addon metadata and browser SDK declarations are TypeScript types.
The browser runtime is supplied by Kaiten; these token endpoints do not host an
addon or provide an OAuth authorization UI.
