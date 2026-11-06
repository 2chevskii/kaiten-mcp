# Service desk and SLA

These [advanced operations](./api.md) share `kaiten_cards_read` and
`kaiten_cards_write`; the total remains 20 tools. Full client responses are
preserved in `{result}`.

| Operation                                           | Arguments                   | Tool                 |
| --------------------------------------------------- | --------------------------- | -------------------- |
| `serviceDeskServices.retrieveServicesList`          | None                        | `kaiten_cards_read`  |
| `cardSla.retrieveCardSlaMeasurements`               | `card_id`                   | `kaiten_cards_read`  |
| `cardServiceDeskExternalRecipients.addNewRecipient` | `card_id`, nonempty `email` | `kaiten_cards_write` |
| `cardServiceDeskExternalRecipients.removeRecipient` | `card_id`, nonempty `email` | `kaiten_cards_write` |

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

Add a recipient through `kaiten_cards_write`:

```json
{
  "request": {
    "operation": "cardServiceDeskExternalRecipients.addNewRecipient",
    "args": {"card_id": 10, "email": "person+tag@example.com"}
  }
}
```
