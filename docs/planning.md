# Iterations and legacy sprints

These [advanced operations](./api.md) share `kaiten_navigation_read` and
`kaiten_navigation_write`; the total remains 20 tools. Responses preserve the
complete client JSON in `{result}`.

| Operation                             | Arguments                               | Behavior                                                             |
| ------------------------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| `iterations.createIteration`          | `space_uid`, `body`                     | Create with `title`, optional nullable goal/start/finish dates       |
| `iterations.getIteration`             | `space_uid`, `id`                       | Read an iteration                                                    |
| `iterations.retrieveListOfIterations` | `space_uid`, `query?`                   | Filter by status, data flag, ordering and offset page                |
| `iterations.updateIteration`          | `space_uid`, `id`, `body`               | Update title, goal, status, dates and optional replacement iteration |
| `iterations.deleteIteration`          | `space_uid`, `id`, `new_iteration_id?`  | Delete, optionally specifying a replacement                          |
| `iterations.addCardToIteration`       | `space_uid`, `iteration_id`, `card_uid` | Add a card membership                                                |
| `iterations.retrieveCardsInIteration` | `space_uid`, `iteration_id`, `status?`  | Read membership records, not full card details                       |
| `iterations.removeCardFromIteration`  | `space_uid`, `iteration_id`, `uid`      | Remove a card membership                                             |
| `iterations.getCardIterationsHistory` | `card_uid`, `with_details?`             | Read membership history                                              |
| `sprints.getSprintSummary`            | `id`, `exclude_deleted_cards?`          | Read a legacy sprint summary                                         |
| `sprints.getSprintsList`              | `active?`, `limit?`, `offset?`          | List legacy sprints                                                  |

Iteration identifiers are strings, while legacy sprint IDs are numeric. The
iterations feature must be enabled for the company and is marked beta upstream.
Kaiten enforces space access, active-card membership on primary boards and
status transitions from `planned` to `active` to `closed`; cards cannot be
removed from closed iterations. Deleting an iteration also deletes its card
links, which cannot be restored through this API.

The update contract requires at least one of title, goal, status, start date or
finish date; `actual_finish_date` and `new_iteration_id` can accompany those
changes. Omitted values stay omitted; nullable dates/goals/replacement IDs keep
their explicit nulls. Deleting without a replacement omits the body, whereas
`new_iteration_id: null` sends an explicit null. Dates and native string query
flags such as `with_data` are forwarded unchanged. Lists do not fetch subsequent
pages automatically; retain filters when changing `offset`.

Close an iteration through `kaiten_navigation_write`:

```json
{
  "request": {
    "operation": "iterations.updateIteration",
    "args": {
      "space_uid": "space-uid",
      "id": "iteration-id",
      "body": {"status": "closed", "new_iteration_id": "next-iteration-id"}
    }
  }
}
```
