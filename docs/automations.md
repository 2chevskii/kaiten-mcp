# Automations

Automation operations share `kaiten_navigation_read` and
`kaiten_navigation_write`. The server still exposes 20 tools.

| Operation                          | Arguments                            | Tool                      |
| ---------------------------------- | ------------------------------------ | ------------------------- |
| `automations.getListOfAutomations` | `space_id`                           | `kaiten_navigation_read`  |
| `automations.createAutomation`     | `space_id`, `body`                   | `kaiten_navigation_write` |
| `automations.updateAutomation`     | `space_id`, `automation_uid`, `body` | `kaiten_navigation_write` |
| `automations.deleteAutomation`     | `space_id`, `automation_uid`         | `kaiten_navigation_write` |

Create bodies support `on_action` and `on_date` with a required `trigger`,
optional `name` and recursive `conditions`. An `on_demand` body requires `name`
and has no trigger or conditions. Every create body requires at least one action.
An action has a nonempty `type`, a JSON object `data` and optional `created`.

Triggers accept all 21 names from the pinned client contract, with optional
`hasToFireOnCardCreation` and `data`. Condition groups use `clause: "and"` or
`"or"` and a `conditions` array containing conditions or nested groups. A leaf
condition has `type`, optional `operator`, `data` and `created`. Group `created`
values are also preserved. Action/condition names and their JSON data are
interpreted by Kaiten; use values supported by your instance.

Updates follow the client's partial body contract, including an empty object.
Provided action arrays must remain nonempty. There is no separate status or
execution endpoint in the pinned client. Reads preserve all response fields,
including status, order, triggers and actions, in `{result}`. Kaiten enforces
permissions and feature availability; the normal timeout, cancellation and
sanitized HTTP errors apply.

Inspect existing definitions through `kaiten_navigation_read`:

```json
{
  "request": {
    "operation": "automations.getListOfAutomations",
    "args": {"space_id": 1}
  }
}
```
