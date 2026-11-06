# Addon OAuth

The public `AddonOAuthClient` is available through the existing navigation tools.
The total remains 18 tools.

| Operation                 | Tool                      | Arguments                            |
| ------------------------- | ------------------------- | ------------------------------------ |
| `addonOAuth.getToken`     | `kaiten_navigation_read`  | `addon_uid`, `user_id`, `company_id` |
| `addonOAuth.refreshToken` | `kaiten_navigation_write` | Same token key                       |

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
    "operation": "addonOAuth.getToken",
    "args": {"addon_uid": "your-addon-uid", "user_id": 5, "company_id": 7}
  }
}
```

The client's addon metadata and browser SDK declarations are TypeScript types.
The browser runtime is supplied by Kaiten; these token endpoints do not host an
addon or provide an OAuth authorization UI.
