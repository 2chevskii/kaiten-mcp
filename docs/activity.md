# Activity and audit logs

All five operations use `kaiten_navigation_read`; the total remains 20 tools.
Responses preserve complete JSON, including native event details.

| Operation                          | Arguments                                 | Result                                  |
| ---------------------------------- | ----------------------------------------- | --------------------------------------- |
| `auditLogs.retrieveAuditLogEvents` | Optional `query`                          | `{result: events[]}`                    |
| `activity.listCompanyActivity`     | Optional `query`                          | `{result: {items, limit, next_cursor}}` |
| `activity.listSpaceActivity`       | `space_id`, optional `query`              | Same activity page                      |
| `activity.iterateCompanyActivity`  | Optional `query`, `max_items`             | `{result: {items, truncated}}`          |
| `activity.iterateSpaceActivity`    | `space_id`, optional `query`, `max_items` | Same bounded snapshot                   |

Activity queries accept `limit`, opaque `cursor`, comma-separated `actions`,
`author_id`, `created_after` and `created_before`. Company activity additionally
accepts `card_id`. Pass `next_cursor` as the next request's `cursor` with the
same filters; `null` ends pagination. Cursors are forwarded unchanged.

Iterators use the public client's cursor traversal and loop/metadata checks.
`max_items` defaults to 100 and cannot exceed 1000. One extra item determines
`truncated`; this may fetch another page. A snapshot has no continuation token;
use page operations for resumable exports. The configured timeout and MCP
cancellation cover the entire traversal.

Audit filters are `from`, `to`, `author_id`, `author_uid`, comma-separated
`categories` and `actions`, event `id`, `limit` and `offset`. Audit reads return
one upstream array; advance the offset explicitly. Date filter strings retain
their native representation and are validated by Kaiten. The server validates
positive integer limits and nonnegative integer offsets without inventing an
upstream page-size limit. Access to company activity and audit logs depends on
the token owner's permissions and the Kaiten plan. HTTP failures retain their
status with a sanitized message.

```json
{
  "request": {
    "operation": "activity.listCompanyActivity",
    "args": {"query": {"card_id": 10, "limit": 25}}
  }
}
```
