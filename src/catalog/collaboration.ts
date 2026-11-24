import * as z from 'zod/v4';
import type {CatalogDefinition, CatalogRoute} from '../catalog.ts';
import {fileUpload} from '../file-transfer.ts';
import {id, text} from '../schemas.ts';

const cardField = {card_id: 'Numeric ID of the card that owns these records.'};
const memberFields = {
  ...cardField,
  member_id:
    'Membership record id from list_card_members, separate from the user_id.',
};
const blockerField = {blocker_id: 'Blocker record ID from list_card_blockers.'};
const userField = {
  user_id: 'Numeric Kaiten user ID from workspace or eligible-user lookup.',
};
const commentId = {
  comment_id:
    'Numeric comment id from list_comments. For a separate restricted file upload, use the comment UID from the full read.',
};
const childFields = {
  parent_card_id:
    'Numeric card ID of the existing parent that owns the child relationship.',
  child_card_id:
    'Numeric ID of the existing child card. Use the returned child id from list_card_children.',
};
const linkFields = {
  ...cardField,
  link_id: 'Link record ID from list_card_external_links.',
};
const tagFields = {
  ...cardField,
  tag_id: 'Tag ID attached to the card, from list_card_tags.',
};
const plannedRelationFields = {
  card_id: 'Numeric card ID on the source side of the scheduling dependency.',
  target_card_id:
    'Numeric card ID on the target side of the scheduling dependency.',
};
const plannedRelationType =
  'Which source and target dates are linked: end-start, start-start, end-end or start-end.';

function localPage(
  simple: string,
  full: string,
  description: string,
  scope: 'card_id' | 'parent_card_id' = 'card_id',
): CatalogRoute[] {
  const scopeDescription =
    scope === 'card_id' ? cardField.card_id : childFields.parent_card_id;

  return [
    {
      source: simple,
      description,
      fields: {
        [scope]: scopeDescription,
        limit:
          'Maximum records to return from the fetched list. Defaults to 25, capped at 100.',
        offset:
          'Zero-based index into the fetched list. Reuse next_offset until it is null.',
      },
      outputFields: {
        items: 'Requested slice of the fetched list.',
        next_offset:
          'Position for the next local slice, or null when the fetched list is exhausted.',
      },
    },
    {
      source: full,
      description:
        'Include extra upstream fields in the entire available list.',
      input: z.strictObject({
        [scope]: id.describe(scopeDescription),
        format: z
          .literal('full')
          .describe(
            'Return all records from this API read, including upstream metadata.',
          ),
      }),
      mapArgs: args => ({card_id: args[scope]}),
      outputFields: {
        result:
          'Original record list from Kaiten, including extra upstream fields.',
      },
    },
  ];
}

const formParts = z
  .array(
    z.union([
      z.strictObject({
        name: text.describe(
          'Multipart form field name. Use text for the comment body.',
        ),
        value: z.string().describe('String value for this form field.'),
      }),
      z.strictObject({
        name: text.describe(
          'Multipart field name for the existing legacy upload contract.',
        ),
        file: fileUpload
          .extend({
            filename: fileUpload.shape.filename.describe(
              'Filename to send to Kaiten. Defaults to file.',
            ),
            mime_type: fileUpload.shape.mime_type.describe(
              'Content type of the uploaded bytes. Defaults to application/octet-stream.',
            ),
          })
          .describe(
            'File part with padded base64 bytes, optional filename and MIME type.',
          ),
      }),
    ]),
  )
  .describe(
    'Ordered Kaiten multipart form parts, including repeated names. The configured decoded byte limit applies across all file parts.',
  );

export const collaborationCatalog: CatalogDefinition = {
  collaboration_read: {
    description:
      'Inspect collaboration records attached to Kaiten cards: comments, URL links, members, tags, blockers and child links. Read the corresponding list before editing a record to get its ID. For eligible members use list_allowed_card_users; existing assignments come from list_card_members. List blockers for one card with list_card_blockers or for the token user with list_my_blocked_cards. Comment, link, member, tag and child pagination slices the data already fetched; comment reads are limited to Kaiten’s default upstream page. Use cards_read for card search and content_read for attachment bytes.',
    operations: {
      list_comments: localPage(
        'list_comments',
        'cardComments.retrieveCardComments',
        'Read text from Kaiten’s default comment page. Use format full to obtain comment UIDs and attachment metadata.',
      ),
      list_card_external_links: localPage(
        'list_card_external_links',
        'cardExternalLinks.retrieveCardExternalLinks',
        'Read native URL-link records and their IDs. Read custom-field values with get_card.',
      ),
      list_card_members: localPage(
        'list_card_members',
        'cardMembers.retrieveListOfCardMembers',
        'Read memberships. The record id identifies the membership and user_id identifies the user.',
      ),
      list_card_tags: localPage(
        'list_card_tags',
        'cardTags.rertrieveListOfTags',
        'Read tags attached to this card, including the IDs used for detaching them.',
      ),
      list_card_children: localPage(
        'list_card_children',
        'cardChildren.retrieveCardChildrenList',
        'Read one parent’s child links. Each record id is a child card ID.',
        'parent_card_id',
      ),
      list_allowed_card_users: {
        source: 'cardAllowedUsers.retrieveUsersList',
        description:
          'Find users Kaiten allows for the selected card. Use the search query to narrow candidates before adding a member.',
        fields: {
          ...cardField,
          query: 'Kaiten candidate filters and server-side pagination.',
          'query.type': 'Kaiten candidate type filter.',
          'query.search': 'Search text used to narrow the candidate user list.',
          'query.orderBy': 'Native Kaiten field used to order candidates.',
          'query.role': 'Only match users with this Kaiten role code.',
          'query.limit':
            'Maximum candidates requested from Kaiten for this page.',
          'query.offset':
            'Zero-based API page offset; retain the query filters when advancing it.',
        },
        outputFields: {
          result:
            'Eligible-user records returned by Kaiten for this native page.',
        },
      },
      list_blocker_categories: {
        source: 'cardBlockerCategories.retrieveListOfCategories',
        description:
          'Read available blocker categories. Use the category UID when detaching a category.',
        outputFields: {
          result: 'Blocker category records, including their UIDs.',
        },
      },
      list_my_blocked_cards: {
        source: 'cardBlockerUsers.retrieveBlockersCardsListOnCurrentUser',
        description:
          'Read blocked cards attributed by Kaiten to the user associated with this token.',
        outputFields: {
          result: 'Blocked cards and optional summary data for the token user.',
        },
      },
      list_blocker_users: {
        source: 'cardBlockerUsers.retrieveListOfUsers',
        description:
          'Read users linked to one blocker. Get the blocker record ID from list_card_blockers.',
        fields: blockerField,
        outputFields: {result: 'Users linked to the selected blocker.'},
      },
      list_card_blockers: {
        source: 'cardBlockers.retrieveCardBlockersList',
        description:
          'Read blocker records for one selected card. A blocker record ID identifies the impediment; blocker_card_id identifies another card that is causing it.',
        fields: cardField,
        outputFields: {
          result:
            'Blocker records for the specified card, with IDs and release state as supplied by Kaiten.',
        },
      },
    },
  },
  collaboration_write: {
    description:
      'Change Kaiten card comments, native URL links, memberships, attached tags, blockers, child links and planned dependencies. Resolve record IDs with kaiten_collaboration_read first. Use cards_write for card fields and lifecycle, and content_write for separate attachment uploads. Kaiten enforces the token’s rights on the target card or relationship. Deleting a comment removes it from the thread with no restore operation. Unlinking a child keeps both cards; removing a membership leaves the account intact. Check resulting records before retrying a write after a timeout.',
    operations: {
      add_comment: [
        {
          source: 'cardComments.addComment',
          replaces: ['add_comment'],
          description:
            'Post a comment with text. The result includes native comment identifiers and any attachment metadata.',
          input: z.strictObject({
            card_id: id.describe(cardField.card_id),
            text: z
              .string()
              .describe('Text to post on the selected card’s comment thread.'),
          }),
          mapArgs: ({card_id, text}) => ({card_id, body: {text}}),
          outputFields: {
            result:
              'Created comment, including numeric ID and UID when supplied by Kaiten.',
          },
        },
        {
          source: 'cardComments.addComment',
          description:
            'Post a comment through Kaiten’s multipart contract when a legacy file must accompany the text. For a new restricted attachment use content_write after creating the comment.',
          input: z.strictObject({
            card_id: id.describe(cardField.card_id),
            form: formParts,
          }),
          outputFields: {
            result: 'Created comment with native attachment metadata.',
          },
        },
      ],
      update_comment: [
        {
          source: 'cardComments.updateComment',
          replaces: ['update_comment'],
          description:
            'Replace the selected comment’s text. Resolve the comment’s numeric ID from the card’s thread.',
          input: z.strictObject({
            card_id: id.describe(cardField.card_id),
            comment_id: id.describe(commentId.comment_id),
            text: z.string().describe('Replacement text for the comment.'),
          }),
          mapArgs: ({card_id, comment_id, text}) => ({
            card_id,
            comment_id,
            body: {text},
          }),
          outputFields: {
            result: 'Updated comment, including available native metadata.',
          },
        },
        {
          source: 'cardComments.updateComment',
          description:
            'Edit a comment through Kaiten’s multipart contract for legacy file parts. Submit text and files as ordered parts.',
          input: z.strictObject({
            card_id: id.describe(cardField.card_id),
            comment_id: id.describe(commentId.comment_id),
            form: formParts,
          }),
          outputFields: {
            result: 'Updated comment with native attachment metadata.',
          },
        },
      ],
      delete_comment: {
        source: 'cardComments.removeComment',
        replaces: ['delete_comment'],
        description:
          'Remove a comment from its card thread. Choose update_comment to retain the record and correct its text.',
        fields: {...cardField, ...commentId},
        outputFields: {
          result:
            'Removal response from Kaiten, including the removed comment ID when returned.',
        },
      },
      add_card_external_link: {
        source: 'cardExternalLinks.addExternalLink',
        replaces: ['add_card_external_link'],
        description:
          'Create a native URL-link record. For URL values stored in a custom field, choose custom_properties_write.',
        fields: {
          ...cardField,
          url: 'Destination URL for the native card link.',
          description: 'Optional display label for the link.',
        },
        outputFields: {
          result:
            'Created link record with the ID for subsequent edits or removal.',
        },
      },
      update_card_external_link: {
        source: 'cardExternalLinks.updateExternalLink',
        replaces: ['update_card_external_link'],
        description: 'Change a URL or its label on an existing native link.',
        input: input => input.omit({id: true}).extend({link_id: id}),
        mapArgs: ({card_id, link_id, body}) => ({card_id, id: link_id, body}),
        fields: {
          ...linkFields,
          body: 'Patch with a URL, label or both. Omitted fields stay unchanged.',
          'body.url': 'Replacement destination URL.',
          'body.description':
            'Replacement display label. Null clears the label.',
        },
        outputFields: {result: 'Updated native URL-link record.'},
      },
      remove_card_external_link: {
        source: 'cardExternalLinks.removeExternalLink',
        replaces: ['remove_card_external_link'],
        description:
          'Delete the selected native URL-link record. Removing it leaves the linked destination intact.',
        input: input => input.omit({id: true}).extend({link_id: id}),
        mapArgs: ({card_id, link_id}) => ({card_id, id: link_id}),
        fields: linkFields,
        outputFields: {result: 'Kaiten removal response for the link record.'},
      },
      add_card_member: {
        source: 'cardMembers.addMemberToCard',
        replaces: ['add_card_member'],
        description:
          'Attach an existing Kaiten user as a card member. Use list_allowed_card_users to check eligible users for this card.',
        fields: {...cardField, ...userField},
        outputFields: {
          result:
            'Created membership record. Use its id in subsequent membership writes.',
        },
      },
      update_card_member_role: {
        source: 'cardMembers.updateMemberRole',
        replaces: ['update_card_member_role'],
        description:
          'Make an existing member responsible for the card. Read memberships first to resolve the membership ID.',
        fields: {
          ...memberFields,
          type: 'Membership role code 2 assigns responsibility.',
        },
        outputFields: {
          result:
            'Kaiten’s updated membership record, including the user and role when supplied.',
        },
      },
      remove_card_member: {
        source: 'cardMembers.removeMemberFromCard',
        replaces: ['remove_card_member'],
        description:
          'Detach a member from a card, removing that card membership and its role.',
        fields: memberFields,
        outputFields: {
          result: 'Kaiten’s response for the detached membership.',
        },
      },
      add_card_tag: {
        source: 'cardTags.addTag',
        replaces: ['add_card_tag'],
        description:
          'Attach a tag by name. Kaiten may create a tag with that name if it does not yet exist.',
        fields: {...cardField, name: 'Name of the tag to attach or create.'},
        outputFields: {
          result: 'Attached tag record, with its ID for detachment.',
        },
      },
      remove_card_tag: {
        source: 'cardTags.removeTagFromCard',
        replaces: ['remove_card_tag'],
        description:
          'Remove a tag from this card while keeping the tag itself available.',
        fields: tagFields,
        outputFields: {result: 'Kaiten’s response for the detached tag.'},
      },
      add_card_child: {
        source: 'cardChildren.addChildren',
        replaces: ['add_card_child'],
        description:
          'Attach an existing card as a child. Use cards_write create_card first when the child does not exist.',
        fields: childFields,
        outputFields: {result: 'The linked child card returned by Kaiten.'},
      },
      remove_card_child: {
        source: 'cardChildren.removeChildren',
        replaces: ['remove_card_child'],
        description:
          'Unlink an existing child from its parent. The child ID comes from list_card_children, and both cards remain available.',
        input: z.strictObject({parent_card_id: id, child_card_id: id}),
        mapArgs: ({parent_card_id, child_card_id}) => ({
          card_id: parent_card_id,
          id: child_card_id,
        }),
        fields: childFields,
        outputFields: {
          result: 'Kaiten’s confirmation of the unlinked child ID.',
        },
      },
      block_card: {
        source: 'cardBlockers.blockCard',
        description:
          'Create an impediment record on a card. Provide a reason or link an existing impediment card. Capture the returned blocker record ID.',
        fields: {
          ...cardField,
          body: 'Provide a reason, a blocker card ID or both.',
          'body.reason':
            'Human-readable explanation of what is blocking this card.',
          'body.blocker_card_id':
            'ID of the card causing the impediment, if applicable.',
        },
        outputFields: {
          result:
            'Created blocker record with the blocker ID for future edits and release.',
        },
      },
      update_card_blocker: {
        source: 'cardBlockers.updateCardBlockers',
        description:
          'Edit a blocker’s reason, linked impediment or due date. Supply a reason or blocker_card_id with the changes.',
        fields: {
          ...cardField,
          ...blockerField,
          body: 'Patch of one blocker. Provide a reason or blocker card ID; deadline fields can accompany it.',
          'body.reason': 'Replacement explanation of the impediment.',
          'body.blocker_card_id': 'New ID of the card causing the impediment.',
          'body.due_date': 'Blocker due date. Null clears it.',
          'body.due_date_time_present':
            'Whether the date includes a display time. Null clears the indicator.',
        },
        outputFields: {result: 'Updated blocker record returned by Kaiten.'},
      },
      release_card_blocker: {
        source: 'cardBlockers.deleteCardBlockers',
        description:
          'Release the specified impediment from one card. Use the blocker record ID to choose which impediment to release.',
        fields: {...cardField, ...blockerField},
        outputFields: {result: 'Kaiten response for the released blocker.'},
      },
      add_blocker_user: {
        source: 'cardBlockerUsers.addUserToTheCardBlocker',
        description:
          'Link a user to a specific blocker record. For participation on the card itself, use add_card_member.',
        fields: {...blockerField, ...userField},
        outputFields: {result: 'User association added to the blocker.'},
      },
      remove_blocker_user: {
        source: 'cardBlockerUsers.removeUser',
        description:
          'Detach a user from a blocker while retaining the blocker record and underlying card membership.',
        fields: {...blockerField, ...userField},
        outputFields: {
          result: 'Kaiten response for the detached blocker user.',
        },
      },
      add_blocker_category: {
        source: 'cardBlockerCategories.addBlockerCategory',
        description:
          'Attach a named category to a blocker, creating the category if Kaiten needs to.',
        fields: {
          ...blockerField,
          name: 'Category name to link to the blocker.',
        },
        outputFields: {result: 'Category record with its UID when returned.'},
      },
      remove_blocker_category: {
        source: 'cardBlockerCategories.removeCategory',
        description:
          'Detach a category from a blocker. Obtain its category UID from list_blocker_categories.',
        fields: {
          ...blockerField,
          category_uuid: 'UID of the category to detach from this blocker.',
        },
        outputFields: {
          result: 'Kaiten response for the detached blocker category.',
        },
      },
      add_planned_relation: {
        source: 'cardPlannedRelations.addPlannedRelation',
        description:
          'Create a scheduling dependency between two existing cards. Use add_card_child for hierarchy and block_card for an impediment.',
        fields: {
          card_id: plannedRelationFields.card_id,
          body: 'Target card and the dates this scheduling dependency connects.',
          'body.target_card_id': plannedRelationFields.target_card_id,
          'body.type': plannedRelationType,
        },
        outputFields: {
          result:
            'New dependency between the specified source and target cards.',
        },
      },
      update_planned_relation: {
        source: 'cardPlannedRelations.updatePlannedRelation',
        description:
          'Change a scheduling dependency’s date endpoints or signed gap. To clear the gap, supply null for both gap and gap_type.',
        fields: {
          ...plannedRelationFields,
          body: 'Partial dependency patch: type, signed gap, gap units (hours or days), or paired nulls to clear the gap.',
        },
        outputFields: {result: 'Updated scheduling dependency.'},
      },
      remove_planned_relation: {
        source: 'cardPlannedRelations.removePlannedRelation',
        description:
          'Delete the scheduling dependency between the source and target cards. Both cards remain available.',
        fields: plannedRelationFields,
        outputFields: {
          result: 'Kaiten confirmation for the removed dependency.',
        },
      },
    },
  },
};
