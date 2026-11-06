import * as z from 'zod/v4';
import {hasChanges, id, pageFields} from '../schemas.ts';
import {read, change, type ToolRegistry} from '../tool-registry.ts';
import {apiResult} from '../results.ts';

export function registerCardBlockersAndRelations(registry: ToolRegistry): void {
  const {client} = registry;
  registry.group('relations');
  registry.add(
    'cardAllowedUsers.retrieveUsersList',
    'Retrieve users list (cardAllowedUsers); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      query: z
        .strictObject({
          type: z.string().optional(),
          search: z.string().optional(),
          orderBy: z.string().optional(),
          role: z.number().optional(),
          limit: pageFields.limit.removeDefault().optional(),
          offset: pageFields.offset.removeDefault().optional(),
        })
        .optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cardAllowedUsers.retrieveUsersList(
        args.card_id,
        args.query as Parameters<
          typeof client.cardAllowedUsers.retrieveUsersList
        >[1],
        options,
      ),
    }),
  );
  registry.add(
    'cardBlockerCategories.addBlockerCategory',
    'Add blocker category (cardBlockerCategories); full API fields and JSON response.',
    z.strictObject({blocker_id: id, name: z.string()}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardBlockerCategories.addBlockerCategory(
        args.blocker_id,
        args.name,
        options,
      ),
    }),
  );
  registry.add(
    'cardBlockerCategories.removeCategory',
    'Remove category (cardBlockerCategories); full API fields and JSON response.',
    z.strictObject({blocker_id: id, category_uuid: z.string()}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardBlockerCategories.removeCategory(
        args.blocker_id,
        args.category_uuid,
        options,
      ),
    }),
  );
  registry.add(
    'cardBlockerCategories.retrieveListOfCategories',
    'Retrieve list of categories (cardBlockerCategories); full API fields and JSON response.',
    z.strictObject({}),
    apiResult,
    read,
    async (_args, options) => ({
      result:
        await client.cardBlockerCategories.retrieveListOfCategories(options),
    }),
  );
  registry.add(
    'cardBlockerUsers.addUserToTheCardBlocker',
    'Add user to the card blocker (cardBlockerUsers); full API fields and JSON response.',
    z.strictObject({blocker_id: id, user_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardBlockerUsers.addUserToTheCardBlocker(
        args.blocker_id,
        args.user_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardBlockerUsers.removeUser',
    'Remove user (cardBlockerUsers); full API fields and JSON response.',
    z.strictObject({blocker_id: id, user_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardBlockerUsers.removeUser(
        args.blocker_id,
        args.user_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardBlockerUsers.retrieveBlockersCardsListOnCurrentUser',
    'Retrieve blockers cards list on current user (cardBlockerUsers); full API fields and JSON response.',
    z.strictObject({}),
    apiResult,
    read,
    async (_args, options) => ({
      result:
        await client.cardBlockerUsers.retrieveBlockersCardsListOnCurrentUser(
          options,
        ),
    }),
  );
  registry.add(
    'cardBlockerUsers.retrieveListOfUsers',
    'Retrieve list of users (cardBlockerUsers); full API fields and JSON response.',
    z.strictObject({blocker_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cardBlockerUsers.retrieveListOfUsers(
        args.blocker_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardBlockers.blockCard',
    'Block card (cardBlockers); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      body: z
        .strictObject({
          reason: z.string().optional(),
          blocker_card_id: id.optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardBlockers.blockCard(
        args.card_id,
        args.body as Parameters<typeof client.cardBlockers.blockCard>[1],
        options,
      ),
    }),
  );
  registry.add(
    'cardBlockers.deleteCardBlockers',
    'Delete card blockers (cardBlockers); full API fields and JSON response.',
    z.strictObject({card_id: id, blocker_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardBlockers.deleteCardBlockers(
        args.card_id,
        args.blocker_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardBlockers.retrieveCardBlockersList',
    'Retrieve card blockers list (cardBlockers); full API fields and JSON response.',
    z.strictObject({card_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cardBlockers.retrieveCardBlockersList(
        args.card_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardBlockers.updateCardBlockers',
    'Update card blockers (cardBlockers); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      blocker_id: id,
      body: z
        .strictObject({
          reason: z.string().optional(),
          blocker_card_id: id.optional(),
          due_date: z.string().nullable().optional(),
          due_date_time_present: z.boolean().nullable().optional(),
        })
        .refine(
          value =>
            value.reason !== undefined || value.blocker_card_id !== undefined,
          'Supply at least one of: reason, blocker_card_id.',
        ),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardBlockers.updateCardBlockers(
        args.card_id,
        args.blocker_id,
        args.body as Parameters<
          typeof client.cardBlockers.updateCardBlockers
        >[2],
        options,
      ),
    }),
  );
  registry.group('children');
  registry.add(
    'cardChildren.addChildren',
    'Add children (cardChildren); full API fields and JSON response.',
    z.strictObject({parent_card_id: id, child_card_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardChildren.addChildren(
        args.parent_card_id,
        args.child_card_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardChildren.removeChildren',
    'Remove children (cardChildren); full API fields and JSON response.',
    z.strictObject({card_id: id, id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardChildren.removeChildren(
        args.card_id,
        args.id,
        options,
      ),
    }),
  );
  registry.add(
    'cardChildren.retrieveCardChildrenList',
    'Retrieve card children list (cardChildren); full API fields and JSON response.',
    z.strictObject({card_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cardChildren.retrieveCardChildrenList(
        args.card_id,
        options,
      ),
    }),
  );
  registry.group('external_links');
  registry.add(
    'cardExternalLinks.addExternalLink',
    'Add external link (cardExternalLinks); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      url: z.string(),
      description: z.string().nullable().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardExternalLinks.addExternalLink(
        args.card_id,
        args.url,
        args.description,
        options,
      ),
    }),
  );
  registry.add(
    'cardExternalLinks.removeExternalLink',
    'Remove external link (cardExternalLinks); full API fields and JSON response.',
    z.strictObject({card_id: id, id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardExternalLinks.removeExternalLink(
        args.card_id,
        args.id,
        options,
      ),
    }),
  );
  registry.add(
    'cardExternalLinks.retrieveCardExternalLinks',
    'Retrieve card external links (cardExternalLinks); full API fields and JSON response.',
    z.strictObject({card_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cardExternalLinks.retrieveCardExternalLinks(
        args.card_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardExternalLinks.updateExternalLink',
    'Update external link (cardExternalLinks); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      id: id,
      body: z
        .strictObject({
          url: z.string().optional(),
          description: z.string().nullable().optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardExternalLinks.updateExternalLink(
        args.card_id,
        args.id,
        args.body as Parameters<
          typeof client.cardExternalLinks.updateExternalLink
        >[2],
        options,
      ),
    }),
  );
  registry.group('relations');
  registry.add(
    'cardMembers.addMemberToCard',
    'Add member to card (cardMembers); full API fields and JSON response.',
    z.strictObject({card_id: id, user_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardMembers.addMemberToCard(
        args.card_id,
        args.user_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardMembers.removeMemberFromCard',
    'Remove member from card (cardMembers); full API fields and JSON response.',
    z.strictObject({card_id: id, member_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardMembers.removeMemberFromCard(
        args.card_id,
        args.member_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardMembers.retrieveListOfCardMembers',
    'Retrieve list of card members (cardMembers); full API fields and JSON response.',
    z.strictObject({card_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cardMembers.retrieveListOfCardMembers(
        args.card_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardMembers.updateMemberRole',
    'Update member role (cardMembers); full API fields and JSON response.',
    z.strictObject({card_id: id, member_id: id, type: z.literal(2)}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardMembers.updateMemberRole(
        args.card_id,
        args.member_id,
        args.type,
        options,
      ),
    }),
  );
  registry.add(
    'cardPlannedRelations.addPlannedRelation',
    'Add planned relation (cardPlannedRelations); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      body: z.strictObject({
        target_card_id: id,
        type: z.union([
          z.literal('end-start'),
          z.literal('start-start'),
          z.literal('end-end'),
          z.literal('start-end'),
        ]),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardPlannedRelations.addPlannedRelation(
        args.card_id,
        args.body as Parameters<
          typeof client.cardPlannedRelations.addPlannedRelation
        >[1],
        options,
      ),
    }),
  );
  registry.add(
    'cardPlannedRelations.updatePlannedRelation',
    'Update planned relation (cardPlannedRelations); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      target_card_id: id,
      body: z.union([
        z.strictObject({
          type: z.union([
            z.literal('end-start'),
            z.literal('start-start'),
            z.literal('end-end'),
            z.literal('start-end'),
          ]),
          gap: z.number().optional(),
          gap_type: z.union([z.literal('hours'), z.literal('days')]).optional(),
        }),
        z.strictObject({
          type: z
            .union([
              z.literal('end-start'),
              z.literal('start-start'),
              z.literal('end-end'),
              z.literal('start-end'),
            ])
            .optional(),
          gap: z.number(),
          gap_type: z.union([z.literal('hours'), z.literal('days')]).optional(),
        }),
        z.strictObject({
          type: z
            .union([
              z.literal('end-start'),
              z.literal('start-start'),
              z.literal('end-end'),
              z.literal('start-end'),
            ])
            .optional(),
          gap: z.number().optional(),
          gap_type: z.union([z.literal('hours'), z.literal('days')]),
        }),
        z.strictObject({
          type: z
            .union([
              z.literal('end-start'),
              z.literal('start-start'),
              z.literal('end-end'),
              z.literal('start-end'),
            ])
            .optional(),
          gap: z.null(),
          gap_type: z.null(),
        }),
      ]),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardPlannedRelations.updatePlannedRelation(
        args.card_id,
        args.target_card_id,
        args.body as Parameters<
          typeof client.cardPlannedRelations.updatePlannedRelation
        >[2],
        options,
      ),
    }),
  );
  registry.add(
    'cardPlannedRelations.removePlannedRelation',
    'Remove planned relation (cardPlannedRelations); full API fields and JSON response.',
    z.strictObject({card_id: id, target_card_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardPlannedRelations.removePlannedRelation(
        args.card_id,
        args.target_card_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardTags.addTag',
    'Add tag (cardTags); full API fields and JSON response.',
    z.strictObject({card_id: id, name: z.string()}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardTags.addTag(args.card_id, args.name, options),
    }),
  );
  registry.add(
    'cardTags.removeTagFromCard',
    'Remove tag from card (cardTags); full API fields and JSON response.',
    z.strictObject({card_id: id, tag_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardTags.removeTagFromCard(
        args.card_id,
        args.tag_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardTags.rertrieveListOfTags',
    'Rertrieve list of tags (cardTags); full API fields and JSON response.',
    z.strictObject({card_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cardTags.rertrieveListOfTags(args.card_id, options),
    }),
  );
}
