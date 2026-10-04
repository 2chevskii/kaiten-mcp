import * as z from 'zod/v4';
import {id, pageFields, text} from '../schemas.ts';
import {entityResult, offsetPage, pageResult} from '../results.ts';
import {change, create, read, type ToolRegistry} from '../tool-registry.ts';
import {identityView, tagView, userView} from '../views.ts';

export function registerCardRelations(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'list_card_members',
    'List card memberships. Use the returned id as member_id and user_id to identify the user.',
    z.strictObject({card_id: id, ...pageFields}),
    pageResult(userView),
    read,
    async (args, options) =>
      offsetPage(
        await client.cardMembers.retrieveListOfCardMembers(
          args.card_id,
          options,
        ),
        args,
        true,
      ),
  );
  registry.add(
    'add_card_member',
    'Add an existing user to a card using user_id.',
    z.strictObject({card_id: id, user_id: id}),
    entityResult(userView),
    create,
    async (args, options) => ({
      item: await client.cardMembers.addMemberToCard(
        args.card_id,
        args.user_id,
        options,
      ),
    }),
  );
  registry.add(
    'update_card_member_role',
    'Set a card membership role using the Kaiten numeric type. Use the membership id returned by list_card_members.',
    z.strictObject({
      card_id: id,
      member_id: id,
      type: z.number().int().positive(),
    }),
    entityResult(userView),
    change,
    async (args, options) => ({
      item: await client.cardMembers.updateMemberRole(
        args.card_id,
        args.member_id,
        args.type,
        options,
      ),
    }),
  );
  registry.add(
    'remove_card_member',
    'Remove a membership from a card using its member_id.',
    z.strictObject({card_id: id, member_id: id}),
    entityResult(identityView),
    change,
    async (args, options) => ({
      item: await client.cardMembers.removeMemberFromCard(
        args.card_id,
        args.member_id,
        options,
      ),
    }),
  );
  registry.add(
    'list_card_tags',
    'List tags attached to a card. Pagination is applied locally.',
    z.strictObject({card_id: id, ...pageFields}),
    pageResult(tagView),
    read,
    async (args, options) =>
      offsetPage(
        await client.cardTags.rertrieveListOfTags(args.card_id, options),
        args,
        true,
      ),
  );
  registry.add(
    'add_card_tag',
    'Attach a tag by name. Kaiten may create the tag if it does not exist.',
    z.strictObject({card_id: id, name: text}),
    entityResult(tagView),
    create,
    async (args, options) => ({
      item: await client.cardTags.addTag(args.card_id, args.name, options),
    }),
  );
  registry.add(
    'remove_card_tag',
    'Detach a tag from a card using tag_id.',
    z.strictObject({card_id: id, tag_id: id}),
    entityResult(identityView),
    change,
    async (args, options) => ({
      item: await client.cardTags.removeTagFromCard(
        args.card_id,
        args.tag_id,
        options,
      ),
    }),
  );
}
