# Time tracking and reports

These [advanced operations](./api.md) share `kaiten_cards_read` and
`kaiten_cards_write`; the server still exposes 18 tools. Responses preserve the
complete upstream JSON in `{result}`, including report aggregates.

| Operation                      | Arguments                           | Behavior                                                              |
| ------------------------------ | ----------------------------------- | --------------------------------------------------------------------- |
| `cardTimeLogs.addTimeLog`      | `card_id`, `body`                   | Log time with `role_id`, `time_spent`, `for_date`, optional `comment` |
| `cardTimeLogs.getTimeLogs`     | `card_id`, `for_date?`, `personal?` | Read a card's time-log response                                       |
| `cardTimeLogs.updateLogRecord` | `card_id`, `time_log_id`, `body`    | Change role, minutes, date or comment; at least one field required    |
| `cardTimeLogs.removeTimeLog`   | `card_id`, `time_log_id`            | Remove a log record                                                   |
| `timesheet.getList`            | `query`                             | Filter, group and page time reports                                   |

Kaiten records `time_spent` in minutes and uses `role_id: -1` for the built-in
Employee role. Custom role IDs remain positive safe integers. The role lookup,
update/removal and replacement inputs also accept that built-in ID; Kaiten
enforces which role operations are permitted. See the
[official timesheet reference](https://developers.kaiten.ru/timesheet/get-list).

Dates use calendar-valid `YYYY-MM-DD`, without a time component. Time-report
queries require `from` and `to`, and accept array or comma-separated ID filters
for tags, users, groups, spaces, boards, columns, cards and visible columns.
They also expose native condition, grouping, time-unit/precision, daily
distribution and general-sum options. Values are passed to the client unchanged;
zero, false and empty comment strings are preserved.

The timesheet page limit is 1–200; `offset` selects subsequent pages. Raw report
responses are preserved even when a grouping option changes their JSON shape.
The pinned client's card-specific `getTimeLogs` method has no pagination
parameters and the upstream endpoint caps its response at 100 logs. Use
`timesheet.getList` with an explicit date range and `card_ids` for paginated
reports; the MCP does not silently truncate or invent a cursor for a raw response.

Log an hour as Employee through `kaiten_cards_write`:

```json
{
  "request": {
    "operation": "cardTimeLogs.addTimeLog",
    "args": {
      "card_id": 10,
      "body": {
        "role_id": -1,
        "time_spent": 60,
        "for_date": "2026-11-06",
        "comment": "Investigation"
      }
    }
  }
}
```
