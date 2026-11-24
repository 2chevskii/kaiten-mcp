# Iterations and legacy sprints

With the canonical profile, use `kaiten_workflows_read` to list iterations,
get one iteration, list its memberships, or follow a card's participation.
Use `kaiten_workflows_write` to create, update, delete, add or remove memberships.
The legacy numeric sprint ID works with `list_legacy_sprints` and
`get_legacy_sprint_summary`. The public sprint endpoints are deprecated reads.
Use the iteration lifecycle for current planning changes.

The canonical `list_iterations` accepts status, order, limit and offset.
Call `list_iteration_memberships` with `status: "active"` to read current
members. The public API rejects the old `with_data` query.

- [Legacy sprint API](https://developers.kaiten.ru/sprints/get-sprints-list)
- [Iteration list API](https://developers.kaiten.ru/iterations/retrieve-list-of-iterations)
- [Iteration membership API](https://developers.kaiten.ru/iterations/retrieve-cards-in-iteration)

## Add or transfer iteration memberships

Use `kaiten_workflows_write` with `add_iteration_member`. Supply `space_uid`,
`iteration_id` and either `card_uid` for one card or `card_uids` for a batch of
1–500 distinct card UUIDs. Get the iteration ID with `list_iterations` and each
card UUID from `result.uid` in `kaiten_cards_read` by calling `get_card` with
`format: "full"`.

Add active cards from the space's primary boards to a planned or active
iteration. If a card already belongs to another planned or active iteration,
Kaiten transfers it to the target.

The single-card form returns one membership. The batch form returns four arrays
in `result`.

- `added` contains new memberships in the target iteration.
- `removed` contains memberships removed from previous iterations during transfers.
- `skipped` contains memberships already present in the target iteration.
- `ineligible` contains UUIDs of cards that became ineligible during execution.

Kaiten checks addition and active-source removal restrictions for the whole
batch before writing. A restriction refusal leaves the batch unapplied. Once
execution begins, Kaiten writes transactions of up to 100 cards. A later
failure can leave earlier batches applied. Check current membership with
`list_iteration_memberships` and each card's history with
`list_card_iteration_history` before retrying.

[Addition API](https://developers.kaiten.ru/iterations/add-card-to-iteration)

## Remove iteration memberships

Use `kaiten_workflows_write` with `remove_iteration_member`. Supply `space_uid`,
`iteration_id` and the `uid` of one card, or supply `card_uids` with 1–500
distinct card UIDs for a native bulk removal. Resolve the UIDs with
`list_iteration_memberships`.

Bulk removal affects manual memberships and returns the removed membership
records. Kaiten ignores cards outside the iteration and rejects the whole
request on an iteration restriction violation before the first write. Once
execution begins, transactions of up to 100 cards can leave earlier batches
applied if a later batch fails. Read back memberships before retrying.

[Bulk removal API](https://developers.kaiten.ru/iterations/remove-cards-from-iteration)

## Legacy profile

These [advanced operations](./api.md) share `kaiten_navigation_read` and
`kaiten_navigation_write`; the total remains 20 tools. Responses preserve the
complete client JSON in `{result}`.

| Operation                             | Arguments                               | Behavior                                                             |
| ------------------------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| `iterations.createIteration`          | `space_uid`, `body`                     | Create with `title`, optional nullable goal/start/finish dates       |
| `iterations.getIteration`             | `space_uid`, `id`                       | Read an iteration                                                    |
| `iterations.retrieveListOfIterations` | `space_uid`, `query?`                   | Filter by status, ordering and offset page                           |
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
`new_iteration_id: null` sends an explicit null. Dates are forwarded unchanged. The legacy profile still accepts native string query
flags such as `with_data`, which the public API stopped accepting on November 1, 2026.
Lists do not fetch subsequent
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
