import * as z from 'zod/v4';
import type {CatalogDefinition, CatalogRoute} from '../catalog.ts';
import {fileUpload} from '../file-transfer.ts';
import {id, text} from '../schemas.ts';

const nativeRecords = z.object({
  result: z
    .array(z.looseObject({}))
    .describe(
      'Records from the upstream API response including additional fields returned by Kaiten.',
    ),
});
const nativeComment = z.object({
  result: z.looseObject({
    id: id.describe('Numeric comment ID for edits and removal.'),
    uid: z
      .string()
      .optional()
      .describe('Comment UID for restricted attachments.'),
  }),
});
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
): CatalogRoute[] {
  return [
    {
      source: simple,
      description,
      fields: {
        ...cardField,
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
      output: nativeRecords,
      description:
        'Include extra upstream fields in the entire available list.',
      input: z.strictObject({
        card_id: id.describe(cardField.card_id),
        format: z
          .literal('full')
          .describe(
            'Return all records from this API read, including upstream metadata.',
          ),
      }),
      mapArgs: ({card_id}) => ({card_id}),
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
        name: text.describe('Legacy file field name, normally files[].'),
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
    description: [
      'Read Kaiten card comments, native links, members, tags, blockers and child links. Find cards with kaiten_cards_read and fetch attachment bytes with kaiten_content_read.',
      'IDs: use list_allowed_card_users before adding a member. For an existing membership, use its record id. Use list_card_blockers with card_id or list_my_blocked_cards for the token user. Feed a returned blocker record id into list_blocker_users. Use list_blocker_categories for category UUIDs.',
      'Paging: comments, children and blockers use server pages. Compact link, membership and tag lists slice locally. To discover comment UUIDs for attachments, start list_comments with card_id, format: "full" and limit: 20. Pass next_offset back as offset with the same arguments until it is null.',
    ].join('\n'),
    operations: {
      list_comments: {
        source: 'catalog.listComments',
        replaces: ['list_comments', 'cardComments.retrieveCardComments'],
        description:
          'Read a server page of comments. Choose full metadata to obtain comment UIDs and attachment fields.',
        fields: {
          ...cardField,
          format:
            'Defaults to compact comment text and IDs. Use full to keep all upstream metadata in items.',
        },
        outputFields: {
          items:
            'Records from this server page, projected according to format.',
          next_offset:
            'Pass as offset on the next page with unchanged arguments. Null means the last page was short or empty.',
        },
      },
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
      list_card_children: {
        source: 'catalog.listCardChildren',
        replaces: [
          'list_card_children',
          'cardChildren.retrieveCardChildrenList',
        ],
        description:
          'Read a server page of one parent’s child links. Each record id is a child card ID.',
        fields: {
          parent_card_id: childFields.parent_card_id,
          format:
            'Defaults to card summaries. Use full for all upstream fields, including properties affected by broken_api.',
        },
        outputFields: {
          items:
            'Records from this server page, projected according to format.',
          next_offset:
            'Pass as offset on the next page with unchanged arguments. Null means the last page was short or empty.',
        },
      },
      list_allowed_card_users: {
        source: 'cardAllowedUsers.retrieveUsersList',
        output: nativeRecords,
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
            'Maximum candidates requested from Kaiten for this page. The server defaults to 100 and caps the page at 100.',
          'query.offset':
            'Zero-based API page offset; retain the query filters when advancing it.',
        },
      },
      list_blocker_categories: {
        source: 'cardBlockerCategories.retrieveListOfCategories',
        output: nativeRecords,
        description:
          'Read available blocker categories. Use the category UID when detaching a category.',
      },
      list_my_blocked_cards: {
        source: 'catalog.listMyBlockedCards',
        replaces: ['cardBlockerUsers.retrieveBlockersCardsListOnCurrentUser'],
        description:
          'Read a server page of blocked cards attributed by Kaiten to the token user, along with the original blocker summary.',
        outputFields: {
          'result.blocked_cards':
            'Blocked cards for the token user in this server page.',
          next_offset:
            'Pass as offset on the next page. Null means the last page was short or empty.',
        },
      },
      list_blocker_users: {
        source: 'cardBlockerUsers.retrieveListOfUsers',
        output: nativeRecords,
        description:
          'Read users linked to one blocker. Get the blocker record ID from list_card_blockers.',
        fields: blockerField,
      },
      list_card_blockers: {
        source: 'catalog.listCardBlockers',
        replaces: ['cardBlockers.retrieveCardBlockersList'],
        description:
          'Read a server page of blockers for one card. blocker_id selects the record; blocker_card_id points to the card causing it.',
        fields: cardField,
        outputFields: {
          result: 'Original Kaiten blocker records for this server page.',
          next_offset:
            'Pass as offset on the next page with unchanged arguments. Null means the last page was short or empty.',
        },
      },
    },
  },
  collaboration_write: {
    description: [
      'Change Kaiten card discussion, native links, memberships, tags, blockers, child links and planned dependencies. Resolve IDs with kaiten_collaboration_read. Use kaiten_cards_write for card fields and lifecycle, and kaiten_content_write for separate attachments.',
      'Choose request.operation and its matching args. For add_comment send card_id with text, or use form for ordered legacy multipart parts. For a restricted attachment, post the comment first and use its returned UID in kaiten_content_write. For a role change, send card_id, member_id from the existing membership and type: 2 for responsible.',
      'Adding a tag by name may create it. Release a blocker with card_id and blocker_id. The linked card stays intact. Unlinking a child keeps both cards, and detaching a member keeps the account. Comment deletion has no restore operation. Kaiten enforces target access. After a timeout, read the affected record before retrying.',
    ].join('\n'),
    operations: {
      add_comment: [
        {
          source: 'cardComments.addComment',
          output: nativeComment,
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
        },
        {
          source: 'cardComments.addComment',
          output: nativeComment,
          description:
            'Post a comment through Kaiten’s multipart contract when a legacy file must accompany the text. For a new restricted attachment use content_write after creating the comment.',
          input: z.strictObject({
            card_id: id.describe(cardField.card_id),
            form: formParts,
          }),
        },
      ],
      update_comment: [
        {
          source: 'cardComments.updateComment',
          output: nativeComment,
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
        },
        {
          source: 'cardComments.updateComment',
          output: nativeComment,
          description:
            'Edit a comment through Kaiten’s multipart contract for legacy file parts. Submit text and files as ordered parts.',
          input: z.strictObject({
            card_id: id.describe(cardField.card_id),
            comment_id: id.describe(commentId.comment_id),
            form: formParts,
          }),
        },
      ],
      delete_comment: {
        source: 'cardComments.removeComment',
        replaces: ['delete_comment'],
        description:
          'Remove a comment from its card thread. Choose update_comment to retain the record and correct its text.',
        fields: {...cardField, ...commentId},
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
      },
      remove_card_external_link: {
        source: 'cardExternalLinks.removeExternalLink',
        replaces: ['remove_card_external_link'],
        description:
          'Delete the selected native URL-link record. Removing it leaves the linked destination intact.',
        input: input => input.omit({id: true}).extend({link_id: id}),
        mapArgs: ({card_id, link_id}) => ({card_id, id: link_id}),
        fields: linkFields,
      },
      add_card_member: {
        source: 'cardMembers.addMemberToCard',
        replaces: ['add_card_member'],
        description:
          'Attach an existing Kaiten user as a card member. Use list_allowed_card_users to check eligible users for this card.',
        fields: {...cardField, ...userField},
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
      },
      remove_card_member: {
        source: 'cardMembers.removeMemberFromCard',
        replaces: ['remove_card_member'],
        description:
          'Detach a member from a card, removing that card membership and its role.',
        fields: memberFields,
      },
      add_card_tag: {
        source: 'cardTags.addTag',
        replaces: ['add_card_tag'],
        description:
          'Attach a tag by name. Kaiten may create a tag with that name if it does not yet exist.',
        fields: {...cardField, name: 'Name of the tag to attach or create.'},
      },
      remove_card_tag: {
        source: 'cardTags.removeTagFromCard',
        replaces: ['remove_card_tag'],
        description:
          'Remove a tag from this card while keeping the tag itself available.',
        fields: tagFields,
      },
      add_card_child: {
        source: 'cardChildren.addChildren',
        replaces: ['add_card_child'],
        description:
          'Attach an existing card as a child. Use cards_write create_card first when the child does not exist.',
        fields: childFields,
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
      },
      release_card_blocker: {
        source: 'cardBlockers.deleteCardBlockers',
        description:
          'Release the specified impediment from one card. Use the blocker record ID to choose which impediment to release.',
        fields: {...cardField, ...blockerField},
      },
      add_blocker_user: {
        source: 'cardBlockerUsers.addUserToTheCardBlocker',
        description:
          'Link a user to a specific blocker record. For participation on the card itself, use add_card_member.',
        fields: {...blockerField, ...userField},
      },
      remove_blocker_user: {
        source: 'cardBlockerUsers.removeUser',
        description:
          'Detach a user from a blocker while retaining the blocker record and underlying card membership.',
        fields: {...blockerField, ...userField},
      },
      add_blocker_category: {
        source: 'cardBlockerCategories.addBlockerCategory',
        description:
          'Attach a named category to a blocker, creating the category if Kaiten needs to.',
        fields: {
          ...blockerField,
          name: 'Category name to link to the blocker.',
        },
      },
      remove_blocker_category: {
        source: 'cardBlockerCategories.removeCategory',
        description:
          'Detach a category from a blocker. Obtain its category UID from list_blocker_categories.',
        fields: {
          ...blockerField,
          category_uuid: 'UID of the category to detach from this blocker.',
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
      },
      update_planned_relation: {
        source: 'cardPlannedRelations.updatePlannedRelation',
        description:
          'Change a scheduling dependency’s date endpoints or signed gap. To clear the gap, supply null for both gap and gap_type.',
        fields: {
          ...plannedRelationFields,
          body: 'Partial dependency patch. A partial change of the gap or its units requires an existing gap.',
          'body.type': plannedRelationType,
          'body.gap':
            'Signed gap between the connected dates. Set both gap and gap_type to null to clear it.',
          'body.gap_type': 'Unit for gap: hours or days.',
        },
      },
      remove_planned_relation: {
        source: 'cardPlannedRelations.removePlannedRelation',
        description:
          'Delete the scheduling dependency between the source and target cards. Both cards remain available.',
        fields: plannedRelationFields,
      },
    },
  },
};
