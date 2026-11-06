# Advanced client operations

[Service desk and SLA](./service-desk.md) extend service workflows.

[Iterations and legacy sprints](./planning.md) extend planning workflows.

[Time tracking and reports](./time-tracking.md) extend the card tools.

[Shared checklists and space templates](./checklist-templates.md) extend the checklist tools.

See also [identity and access](./identity.md).
Card type administration and tag creation are described in
[card types and tags](./taxonomy.md).
See [custom-field administration](./custom-fields.md) for definitions, options,
scores and votes.

Advanced operations expose the complete public contracts of the pinned
`@2chevskii/kaiten-client` **1.1.0**. Use these when you need fields beyond the
convenient operations in the [tool reference](./tools.md).

Select the exact `resource.method` name in `request.operation`. Top-level
arguments use the client's parameter names converted to `snake_case`. Nested
`body` and `query` fields retain their upstream spelling, including camelCase
where the Kaiten API uses it. The advertised tool schema lists every accepted
field, enum, required value and nullable value. Unknown fields are rejected,
including inside typed bodies. JSON maps accept arbitrary keys.

The result is `{result: ...}` in both `structuredContent` and JSON text. It
preserves the client's complete JSON response, including fields not included in
the convenient projections. List operations return the upstream list or page
unchanged; they do not apply local pagination or fetch subsequent pages.
Successful operations with no response body return `{result: null}`.

The same token permissions, timeout, cancellation and sanitized error handling
apply. Invalid arguments return an MCP tool error with validation details.
HTTP failures include `KAITEN_HTTP_ERROR` and the upstream status;
for example, 403 means insufficient access and 404 means an unavailable entity.

## Workspace management

Reads use `kaiten_navigation_read`; mutations use `kaiten_navigation_write`.
The server now exposes **16 tools**, with a hard maximum of 20.

| Resource      | Operations after `resource.`                                                            | Arguments                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `spaces`      | `createNewSpace`, `updateSpace`, `removeSpace`, `retrieveSpace`, `retrieveListOfSpaces` | `body` for create; `space_id` and `body` for update; `space_id` for get/delete; `limit?`, `offset?` for list  |
| `spaceBoards` | `createNewBoard`, `getBoard`, `getListOfBoards`, `updateBoard`, `removeBoard`           | `space_id`; `body` for create/update; `id` for get/update/delete; `force?` for delete                         |
| `boards`      | `getBoard`                                                                              | `board_id`                                                                                                    |
| `columns`     | `createNewColumn`, `getListOfColumns`, `updateColumn`, `removeColumn`                   | `board_id`; `body` for create/update; `column_id` for update/delete; `force?` for delete                      |
| `subcolumn`   | `createNewSubcolumn`, `getListOfSubcolumns`, `updateSubcolumn`, `removeSubcolumn`       | `column_id`; `body` for create/update; `subcolumn_id` for update/delete; `force?` for delete                  |
| `lanes`       | `createNewLane`, `getListOfLanes`, `updateLane`, `removeLane`                           | `board_id`; `body` for create/update; `lane_id` for update/delete; `condition?` for list; `force?` for delete |

Use create bodies for initial columns/lanes, external identifiers and board
behavior. Updates support all fields in the client, including WIP limits,
archive policies, SLA pausing, default tags, card-property configuration, space
access/settings and board movement between spaces. Update bodies require at
least one change. An omitted optional field is left unchanged; `null` clears
only fields declared nullable. Force deletion can remove containers with cards;
omit `force` to retain Kaiten's default safeguards.

Create a board with `kaiten_navigation_write`:

```json
{
  "request": {
    "operation": "spaceBoards.createNewBoard",
    "args": {
      "space_id": 1,
      "body": {
        "title": "Delivery",
        "columns": [{"title": "Queue", "type": 1}],
        "lanes": [{"title": "Default"}]
      }
    }
  }
}
```

Read full column configuration with `kaiten_navigation_read`:

```json
{"request": {"operation": "columns.getListOfColumns", "args": {"board_id": 2}}}
```

## Advanced cards and search

All card reads below use `kaiten_cards_read`; mutations use `kaiten_cards_write`.
These operations reuse existing tools, so the total remains 16.

| Operation                             | Arguments                | Behavior                                                                                                                           |
| ------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `cards.createNewCard`, `cards.create` | `body`                   | Equivalent client entry points; includes responsible user, owner email, service, external ID, position, text format and properties |
| `cards.updateCard`                    | `card_id`, `body`        | Full update contract, including workload, planning recalculation, comment flag, ordering and text format                           |
| `cards.deleteCard`                    | `card_id`                | Delete and preserve the complete response                                                                                          |
| `cards.retrieveCard`                  | `card_id`, `broken_api?` | Full card response, including file and relationship references                                                                     |
| `cards.retrieveCardBaselines`         | `card_id`                | Unarchived baselines of unarchived projects                                                                                        |
| `cards.retrieveCardLocationHistory`   | `card_id`                | Card movement history                                                                                                              |
| `cards.batchUpdateForCards`           | `body`                   | Update cards matching a selector, or sort a column/lane; returns the upstream job ID, not a completed-job promise                  |
| `cards.retrieveCardList`              | `query?`                 | Full search contract, including exclusions, ordering, text projections and v1/v2 pagination                                        |
| `cards.iterate`                       | `query?`, `max_items?`   | Client v2 iterator across pages, bounded to 100 items by default (1–1,000)                                                         |
| `encodeCardFilter`                    | `filter`                 | Local structured-filter encoding; no HTTP request                                                                                  |

Batch updates require `attributes` and at least one selector (`board_id`,
`column_id`, `lane_id`, `owner_id`, `type_id`, `condition`), or all three of
`column_id`, `lane_id`, `order_by`. The operation can affect many cards.

Search v1 returns an array; v2 returns `{result: [...], position: "..."}` inside
the outer `{result}` envelope. For the next v2 page, keep the same filters and
pass the returned `position` as `query.start_position`. An empty position marks
the final page. `query.filter` accepts either a pre-encoded string or the
client's structured two-level `and`/`or` filter; the client performs UTF-8 base64
encoding. Predicates cover native fields, paths, dates, source and custom
properties. Numeric custom-property comparison values are strings.

`cards.iterate` returns `{result: {items, truncated}}`. It closes the client
iterator on completion, error or limit; it may read one additional item to
determine truncation. The snapshot has no continuation token. Use
`cards.retrieveCardList` for resumable pagination. The original operation timeout
and cancellation apply to the entire iteration.

Read a v2 page with `kaiten_cards_read`:

```json
{
  "request": {
    "operation": "cards.retrieveCardList",
    "args": {
      "query": {
        "version": 2,
        "board_id": 2,
        "additional_card_fields": ["description"],
        "filter": {
          "key": "and",
          "value": [
            {"key": "and", "value": [{"key": "asap", "comparison": "true"}]}
          ]
        }
      }
    }
  }
}
```

## Blockers and relationships

Reads and writes use the existing tools indicated below; the total remains 16.
All advanced operations return the full response in `{result}`. List reads
return the complete upstream list, with no local pagination.

| Resource                | Operations after `resource.`                                                                             | Tool group and arguments                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `cardAllowedUsers`      | `retrieveUsersList`                                                                                      | `relations_read`: `card_id`, `query?` (`type`, `search`, `orderBy`, `role`, `limit`, `offset`)                                          |
| `cardBlockers`          | `blockCard`, `retrieveCardBlockersList`, `updateCardBlockers`, `deleteCardBlockers`                      | `relations_read`/`relations_write`: `card_id`; `body` for create/update; `blocker_id` for update/delete                                 |
| `cardBlockerUsers`      | `addUserToTheCardBlocker`, `removeUser`, `retrieveListOfUsers`, `retrieveBlockersCardsListOnCurrentUser` | `relations_read`/`relations_write`: `blocker_id`; `user_id` for add/remove; no arguments for current-user blockers                      |
| `cardBlockerCategories` | `addBlockerCategory`, `removeCategory`, `retrieveListOfCategories`                                       | `relations_read`/`relations_write`: `blocker_id` and `name` for add, `blocker_id` and `category_uuid` for remove; no arguments for list |
| `cardPlannedRelations`  | `addPlannedRelation`, `updatePlannedRelation`, `removePlannedRelation`                                   | `relations_write`: `card_id`, `body` for add/update; `target_card_id` for update/remove                                                 |
| `cardMembers`           | `addMemberToCard`, `removeMemberFromCard`, `retrieveListOfCardMembers`, `updateMemberRole`               | `relations_read`/`relations_write`: `card_id`; `user_id` for add; `member_id` for remove/update; `type: 2` for role update              |
| `cardTags`              | `addTag`, `removeTagFromCard`, `rertrieveListOfTags`                                                     | `relations_read`/`relations_write`: `card_id`; `name` for add; `tag_id` for remove                                                      |
| `cardChildren`          | `addChildren`, `removeChildren`, `retrieveCardChildrenList`                                              | `children_read`/`children_write`: `parent_card_id`, `child_card_id` for add; `card_id`, `id` for remove; `card_id` for list             |
| `cardExternalLinks`     | `addExternalLink`, `removeExternalLink`, `retrieveCardExternalLinks`, `updateExternalLink`               | `external_links_read`/`external_links_write`: `card_id`; `url`, `description?` for add; `id` for remove/update; `body` for update       |

Tool groups above have the `kaiten_` prefix. `rertrieveListOfTags` retains the
upstream method's spelling; the convenient `list_card_tags` operation also
remains available.

A blocker body must contain `reason` or `blocker_card_id`. Updating also accepts
`due_date` and `due_date_time_present`, including `null`, but the client's
contract still requires `reason` or `blocker_card_id` in that update.

Planned relations connect `card_id` (predecessor) to `target_card_id` (successor),
independently of hierarchy and blockers. The add body contains `target_card_id`
and `type`: `end-start`, `start-start`, `end-end`, or `start-end`. Updates can
change `type`, a signed `gap`, or `gap_type` (`hours` or `days`). Clear a gap with
both `gap: null` and `gap_type: null`. A partial gap update requires an existing
gap in Kaiten. Removing a planned relation does not change card dates.

Create a dependency with `kaiten_relations_write`:

```json
{
  "request": {
    "operation": "cardPlannedRelations.addPlannedRelation",
    "args": {"card_id": 10, "body": {"target_card_id": 20, "type": "end-start"}}
  }
}
```
