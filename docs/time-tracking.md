# Time tracking and reports

Use `kaiten_workflows_read` for a card’s time logs and timesheets, and `kaiten_workflows_write` to change logs. Time log pages use `limit` and `offset` (default page size 100, maximum 100) and preserve optional `for_date` and `personal` filters. Repeat the request with `next_offset` until it is null. The native report is returned in `{result}`.

| Operation              | Arguments                                                | Behavior                                                              |
| ---------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| `add_card_time_log`    | `card_id`, `body`                                        | Log time with `role_id`, `time_spent`, `for_date`, optional `comment` |
| `list_card_time_logs`  | `card_id`, `for_date?`, `personal?`, `limit?`, `offset?` | Read a card's time-log response                                       |
| `update_card_time_log` | `card_id`, `time_log_id`, `body`                         | Change role, minutes, date or comment; at least one field required    |
| `delete_card_time_log` | `card_id`, `time_log_id`                                 | Remove a log record                                                   |
| `get_timesheet`        | `query`                                                  | Filter, group and page time reports                                   |

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

Log an hour as Employee through `kaiten_workflows_write`:

```json
{
  "request": {
    "operation": "add_card_time_log",
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
