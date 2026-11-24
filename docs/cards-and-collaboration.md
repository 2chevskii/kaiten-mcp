# Cards and collaboration

Use `kaiten_cards_read` to find cards and inspect their fields, and
`kaiten_cards_write` to create, edit, move, archive, restore or delete them. Use
`kaiten_collaboration_read` and `kaiten_collaboration_write` for comments, native
external links, memberships, attached tags, blockers, child links and planning
dependencies. Each call uses `request.operation` and its matching `request.args`.

When a request refers to the current user, call `get_current_user` in
`kaiten_workspace_read` first. Use its ID in `responsible_ids` for my cards unless
the user or their connection guidance specifies a different filter.

## Search and lifecycle

| Intent                                            | Operation and fields                                                                                                                                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Search in ascending card ID order                 | `search_cards` with filters at the top level of `args`. Pass `next_cursor` as `cursor` with the same limits and filters to read the next page.                                                                                                          |
| Search with native sorting, projection or filters | `search_cards` with `mode: "native_page"` and a native `query`. V1 returns an array in `result`. V2 returns a page with `result` and `position` inside the outer `result`; pass that position as `query.start_position` with the same filters and sort. |
| Collect a bounded snapshot                        | `scan_cards` with native `query` and optional `max_items` (default 100, maximum 1,000). If `truncated` is true, switch to paging to retrieve all matches.                                                                                               |
| Read a single card                                | `get_card` with its numeric `card_id`. Use `format: "full"` when you need other native data, such as a card UID for restricted attachments.                                                                                                             |
| Set fields on one card                            | `create_card` takes a `body` with title and board ID. `update_card` takes `card_id` and a partial `body` with at least one change. Both preserve the native card fields in `result`. Resolve the IDs through workspace reads.                           |
| Apply the same changes to a set                   | First verify the selection with `search_cards`. Then call `batch_update_cards` with a selector and attributes, or a column, lane and sort specification. The ID returned is a background job ID.                                                        |
| Remove from active work                           | `archive_card` removes the card from active work. Use `restore_card` to reactivate it. Only use `delete_card` for deletion.                                                                                                                             |

The native query can accept a structured filter or a pre-encoded string. Use
`encode_card_filter` when you need a portable base64 filter token for another
integration. Native search automatically encodes structured filters.

## Collaboration

- List comments before editing to obtain the numeric comment ID. Use
  `format: "full"` on `list_comments` to read comment UIDs and attachment
  metadata. Use `text` for a JSON comment or `form` for a legacy multipart
  comment. For restricted attachment uploads, create the comment first and then
  upload by UID with the content write tool.
- Use `list_allowed_card_users` to find eligible members. For role updates and
  removal, use the membership record ID returned by `list_card_members`.
  `type: 2` makes the selected member responsible.
- Use `list_card_external_links` to find native links and `list_card_tags` for
  tags attached to one card. These lists are separate from custom data and global
  tag discovery.
- Use `list_card_blockers` for one card and `list_my_blocked_cards` for the
  token user. Pass the blocker record ID to update or release a blocker, or to
  change the users and categories attached to it.
- Use the parent card ID and child card ID to attach or detach an existing
  child link. To schedule a dependency between cards, choose
  `add_planned_relation`, `update_planned_relation` or `remove_planned_relation`.

The `limit` and `offset` fields on compact comment, link, member, tag and child
lists slice the fetched response locally. Use `format: "full"` for the native
response, including fields beyond the compact projection. The pinned client reads
one upstream page of up to 100 comments, children or blockers. Local offsets
cannot advance past the upstream page. The allowed-user list accepts server-side
pagination.

## Migrating v2 calls

Set `KAITEN_TOOL_PROFILE=legacy` to keep the [v2 call contracts](./api.md).
The canonical catalog changes some inputs and response envelopes.

| v2 operations                                                                                                       | Canonical call                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cards.createNewCard`, `cards.create`, `create_card`                                                                | `create_card`. Move the old compact fields into `args.body`.                                                                                                                                                                     |
| `cards.updateCard`, `update_card`                                                                                   | `update_card` with `args.body` in place of `args.changes`.                                                                                                                                                                       |
| `cards.deleteCard`, `delete_card`                                                                                   | `delete_card`; response uses `result`.                                                                                                                                                                                           |
| `cards.retrieveCard`, `cards.retrieveCardList`, `cards.iterate`                                                     | `get_card` with `format: "full"`, `search_cards` with `mode: "native_page"`, or `scan_cards` respectively.                                                                                                                       |
| `cards.retrieveCardBaselines`, `cards.retrieveCardLocationHistory`, `cards.batchUpdateForCards`, `encodeCardFilter` | `list_card_baselines`, `list_card_location_history`, `batch_update_cards`, `encode_card_filter`.                                                                                                                                 |
| Native comment, external-link, membership, tag and child list operations                                            | Use the matching `list_*` operation with `format: "full"`. For children, pass the parent as `parent_card_id`.                                                                                                                    |
| Both v2 comment mutation families                                                                                   | `add_comment`, `update_comment` or `delete_comment`. Move `body.text` to `args.text` or keep `args.form`. An empty JSON update remains available through the legacy profile.                                                     |
| Both v2 external link, membership, tag and child mutation families                                                  | Use the corresponding snake_case operation in `kaiten_collaboration_write`. Use `link_id` and `body` for link updates. Child removal takes `parent_card_id` and `child_card_id`. These mutations return native data in `result`. |
| `cardAllowedUsers.retrieveUsersList`                                                                                | `list_allowed_card_users`.                                                                                                                                                                                                       |
| `cardBlockerCategories.*`                                                                                           | `list_blocker_categories`, `add_blocker_category`, `remove_blocker_category`.                                                                                                                                                    |
| `cardBlockerUsers.*`                                                                                                | `list_blocker_users`, `list_my_blocked_cards`, `add_blocker_user`, `remove_blocker_user`.                                                                                                                                        |
| `cardBlockers.*`                                                                                                    | `block_card`, `list_card_blockers`, `update_card_blocker`, `release_card_blocker`.                                                                                                                                               |
| `cardPlannedRelations.*`                                                                                            | `add_planned_relation`, `update_planned_relation`, `remove_planned_relation`.                                                                                                                                                    |
