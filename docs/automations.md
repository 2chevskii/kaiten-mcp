# Automations

List rules by numeric `space_id` with `list_automations` in `kaiten_workflows_read`. Use the returned UID for updates and deletion in `kaiten_workflows_write`. Rule changes may affect subsequent matching cards.

Iteration triggers require the Iterations feature. Use `on_action` with
`iteration_card_added` or `iteration_card_removed` to react to membership
changes. Use `on_date` with `iteration_start_date_on_date` or
`iteration_finish_date_on_date` to schedule a rule around the start or finish
date of iterations in the rule's space. Pass the date schedule in `trigger.data`.
See the trigger settings in the [Kaiten automation API](https://developers.kaiten.ru/automations/create-automation).

| Operation           | Arguments                            | Tool                     |
| ------------------- | ------------------------------------ | ------------------------ |
| `list_automations`  | `space_id`                           | `kaiten_workflows_read`  |
| `create_automation` | `space_id`, `body`                   | `kaiten_workflows_write` |
| `update_automation` | `space_id`, `automation_uid`, `body` | `kaiten_workflows_write` |
| `delete_automation` | `space_id`, `automation_uid`         | `kaiten_workflows_write` |

Create bodies support `on_action` and `on_date` with a required `trigger`,
optional `name` and recursive `conditions`. An `on_demand` body requires `name`
and has no trigger or conditions. Every create body requires at least one action.
An action has a nonempty `type`, a JSON object `data` and optional `created`.

Trigger settings include optional `hasToFireOnCardCreation` and `data`. Condition groups use `clause: "and"` or
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

Inspect existing definitions through `kaiten_workflows_read`:

```json
{
  "request": {
    "operation": "list_automations",
    "args": {"space_id": 1}
  }
}
```
