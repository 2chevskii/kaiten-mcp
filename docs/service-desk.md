# Service desk and SLA

Read routing, external-recipient policy and SLA through `kaiten_workflows_read`. Manage external notification addresses through `kaiten_workflows_write`. Responses retain the native JSON in `{result}`.

| Operation                       | Arguments                   | Tool                     |
| ------------------------------- | --------------------------- | ------------------------ |
| `list_service_desk_services`    | None                        | `kaiten_workflows_read`  |
| `get_card_sla`                  | `card_id`                   | `kaiten_workflows_read`  |
| `add_service_desk_recipient`    | `card_id`, nonempty `email` | `kaiten_workflows_write` |
| `remove_service_desk_recipient` | `card_id`, nonempty `email` | `kaiten_workflows_write` |

Service reads include routing, card location/type, field settings, email masks
and the external-recipient policy when returned by Kaiten. Use the returned
service ID with the advanced card create/update `service_id` field. SLA reads
preserve calendar/workday/holiday data and native `rulesTimeData` metrics,
without unit conversion or aggregation. Lists pass through without local paging.

Recipient mutations call the public client's card recipient endpoints. The
client safely encodes the email in the removal URL, including plus signs and
`@`. Kaiten validates email syntax, token access and service policy; HTTP errors
return their status with a sanitized message, without upstream private details
or automatic write retries.

Add a recipient through `kaiten_workflows_write`:

```json
{
  "request": {
    "operation": "add_service_desk_recipient",
    "args": {"card_id": 10, "email": "person+tag@example.com"}
  }
}
```
