import * as z from 'zod/v4';
import type {CatalogRoute} from '../../catalog.ts';
import {snapshotResult} from './snapshot-result.ts';

const tagQuery = {
  'query.ids': 'Match numeric tag IDs, as an array or comma-separated string.',
  'query.space_id': 'Limit the tag search to this space.',
  'query.query': 'Text to match against tag names.',
  'query.offset': 'Zero-based offset in the filtered tag list.',
  'query.limit': 'Maximum tags requested in one page.',
};
const cardType = 'Numeric workspace card type ID from list_card_types.';
const typeOptions = {
  'body.name': 'Display name for the card type.',
  'body.letter': 'Short label displayed for the card type.',
  'body.color': 'Numeric Kaiten color code for the card type.',
  'body.properties':
    'Deprecated legacy property configuration. Prefer card_properties for new setups.',
  'body.card_properties': 'Default card type field definitions and ordering.',
  'body.suggest_fields':
    'Enable Kaiten’s field suggestions for this card type.',
};

export const taxonomyReads = {
  list_card_types: [
    {
      source: 'list_card_types',
      description:
        'Discover card type names and IDs to create or filter cards. Follow next_offset while keeping the same limit.',
      fields: {
        limit: 'Maximum card types per page.',
        offset: 'Continue at the previous next_offset or start from zero.',
      },
    },
    {
      source: 'cardTypes.getListOfCardTypes',
      description:
        'Read one page with complete card type configuration. Omitted paging fields use Kaiten defaults.',
      input: source =>
        source.safeExtend({
          format: z
            .literal('native')
            .describe('Return complete card type records under result.'),
        }),
      mapArgs: ({limit, offset}) => ({limit, offset}),
    },
  ],
  get_card_type: {
    source: 'cardTypes.getCardType',
    description: 'Inspect one card type and its existing field configuration.',
    fields: {id: cardType},
  },
  list_card_type_bindings: {
    source: 'cardTypeTreeEntities.getListOfTypeTreeEntities',
    description:
      'Discover tree entities where a card type is available. Use list_tree_entities to resolve candidate locations.',
    fields: {type_id: cardType},
  },
  list_workspace_tags: [
    {
      source: 'list_tags',
      description:
        'Find workspace tags by name and optional space. Use collaboration_read when inspecting tags already attached to a card.',
      fields: {
        query: 'Tag name search text.',
        space_id: 'Numeric space ID to scope the search.',
        limit: 'Maximum tags per page.',
        offset: 'Continue at the previous next_offset using the same filters.',
      },
    },
    {
      source: 'tags.retrieveListOfTags',
      description:
        'Read one native tag page with exact ID filtering and complete tag metadata.',
      input: source =>
        source.safeExtend({
          format: z
            .literal('native')
            .describe(
              'Return full tag records under result and accept the native query object.',
            ),
        }),
      mapArgs: ({query}) => ({query}),
      fields: tagQuery,
    },
  ],
  scan_workspace_tags: {
    source: 'tags.iterate',
    description:
      'Collect a bounded tag snapshot across pages. Use list_workspace_tags for resumable pages.',
    fields: {
      ...tagQuery,
      max_items:
        'Maximum tags to collect. A lookahead read determines truncated.',
    },
    output: snapshotResult,
  },
} satisfies Record<string, CatalogRoute | readonly CatalogRoute[]>;

export const taxonomyWrites = {
  create_card_type: {
    source: 'cardTypes.createNewCardType',
    description:
      'Create a reusable workspace card type. Use bind_card_type when making the new type available on a particular workspace tree entity.',
    fields: typeOptions,
  },
  update_card_type: {
    source: 'cardTypes.updateCardType',
    description:
      'Edit an existing card type’s metadata or default fields. Include at least one of name, letter, color, or properties as required by Kaiten.',
    fields: {
      id: cardType,
      ...typeOptions,
      'body.card_properties.regular_property':
        'Built-in card field controlled by this configuration.',
      'body.card_properties.property_uid':
        'Custom property UID when configuring a custom field.',
      'body.card_properties.required':
        'Whether Kaiten requires this field for the card type.',
      'body.card_properties.type_uid':
        'UID of the type associated with this configuration.',
    },
  },
  delete_card_type: {
    source: 'cardTypes.removeCardType',
    description:
      'Delete a workspace card type and specify a replacement for cards of that type. Resolve both IDs before deleting.',
    fields: {
      id: 'Numeric ID of the card type to remove.',
      replace_type_id:
        'Numeric ID of the existing card type that takes its place.',
    },
  },
  bind_card_type: {
    source: 'cardTypeTreeEntities.addTreeEntityToCardType',
    description:
      'Make a card type available on a workspace tree entity. Resolve the tree entity first.',
    fields: {
      type_id: cardType,
      tree_entity_uid: 'Destination entity UID from list_tree_entities.',
    },
  },
  unbind_card_type: {
    source: 'cardTypeTreeEntities.deleteTreeEntityFromCardType',
    description:
      'Remove a card type availability binding while retaining the type and the workspace entity.',
    fields: {
      type_id: cardType,
      uid: 'Bound tree entity UID from list_card_type_bindings.',
    },
  },
  create_workspace_tag: {
    source: 'tags.addTag',
    description:
      'Create a tag in the workspace taxonomy. Use collaboration_write to attach a tag to a specific card.',
    fields: {
      name: 'Name for the new tag.',
      ...tagQuery,
      'query.ids':
        'Native comma-separated tag ID filter for the optional query.',
    },
  },
} satisfies Record<string, CatalogRoute>;
