import type {CatalogRoute} from '../../catalog.ts';
import {nativeResult} from './native-result.ts';

export const compactPage = {
  limit: 'Maximum items in this page. Defaults to 25 and is capped at 100.',
  offset:
    'Zero-based offset. Use next_offset with the same filters until it is null.',
};
export const nativePage = {
  'query.limit':
    'Set the native page size, up to 100. Omitting it uses Kaiten’s default.',
  'query.offset':
    'Zero-based offset. Advance by the rows received and keep the same filters.',
};
const propertyId =
  'Numeric field definition ID from list_custom_properties. Card property keys add the id_ prefix.';
const selectId =
  'Numeric option ID in this select property, from list_select_values.';
const catalogId =
  'Numeric entry ID in this catalog property. Convert it to a string when assigning it to a card.';
const cardProperty = {
  card_id: 'Numeric card ID from kaiten_cards_read.',
  property_id: propertyId,
};
const optionFields = {
  ...compactPage,
  property_id: propertyId,
  query: 'Text to match against existing values of this property.',
};

export const fieldReads = {
  list_custom_properties: [
    {
      source: 'list_custom_properties',
      description:
        'Discover field definitions by name, with their type and settings for interpreting card property values.',
      fields: {...compactPage, query: 'Text to match against field names.'},
    },
    nativeResult({
      source: 'customProperties.getListOfProperties',
      description:
        'Read one native page for ID lookup, sorting, and optional author or value metadata.',
      fields: {
        ...nativePage,
        'query.query': 'Text to match against field names.',
        'query.include_values':
          'Include the values associated with each returned definition.',
        'query.include_author': 'Include the author of each field definition.',
        'query.compact': 'Request the smaller projection from Kaiten.',
        'query.load_by_ids':
          'Enable lookup by ids. Supply both this flag and the ids list.',
        'query.ids': 'Definition IDs to look up when load_by_ids is enabled.',
        'query.order_by': 'Comma-separated fields to sort by.',
        'query.order_direction':
          'Comma-separated sort directions in the order of order_by.',
      },
    }),
  ],
  get_custom_property: [
    {
      source: 'get_custom_property',
      description:
        'Inspect the type, multi_select setting and type-specific data of a known property before writing a card value.',
      fields: {property_id: propertyId},
    },
    nativeResult({
      source: 'customProperties.getProperty',
      description:
        'Read a complete field definition, including metadata outside the compact projection.',
      fields: {property_id: propertyId},
    }),
  ],
  list_select_values: [
    {
      source: 'list_select_values',
      description:
        'Find selectable option IDs. A card stores an array of numeric IDs even when the field permits a single choice.',
      fields: optionFields,
    },
    nativeResult({
      source: 'customPropertySelectValues.getListOfSelectValues',
      description:
        'Page through complete select options with ID, status and sort filters.',
      fields: {
        property_id: propertyId,
        ...nativePage,
        'query.query': 'Search text for select option labels.',
        'query.v2_select_search':
          'Deprecated compatibility flag. Kaiten documents it has no effect.',
        'query.conditions':
          'Lifecycle filters for options, as an array of active, inactive or removed.',
        'query.ids': 'Only include these option IDs.',
        'query.order_by': 'Native field name used to order options.',
      },
    }),
  ],
  get_select_value: {
    source: 'customPropertySelectValues.getSelectValue',
    description:
      'Read a known select option and its current label, status and color.',
    fields: {property_id: propertyId, value_id: selectId},
  },
  list_catalog_values: [
    {
      source: 'list_catalog_values',
      description:
        'Find catalog entry IDs. Assign the chosen ID as a string in the card’s properties map.',
      fields: optionFields,
    },
    nativeResult({
      source: 'customPropertyCatalogValues.getListOfCatalogValues',
      description:
        'Page through full catalog value maps and filter by lifecycle condition.',
      fields: {
        property_id: propertyId,
        ...nativePage,
        'query.query': 'Search text for catalog entries.',
        'query.conditions':
          'Native catalog condition filter string. This endpoint uses a string.',
      },
    }),
  ],
  get_catalog_value: {
    source: 'customPropertyCatalogValues.getCatalogValue',
    description: 'Read a known catalog entry’s structured value and metadata.',
    fields: {property_id: propertyId, value_id: catalogId},
  },
  list_collective_scores: {
    source: 'customPropertyCollectiveScoreValues.getListOfScoreValues',
    description:
      'Read individual score contributions to a collective score field on a card, including IDs for updates.',
    fields: cardProperty,
  },
  list_collective_votes: {
    source: 'customPropertyCollectiveVoteValues.getListOfVoteValues',
    description:
      'Read the emoji and numeric vote records on a card field, including IDs for updates or removal.',
    fields: cardProperty,
  },
  list_property_bindings: {
    source: 'customPropertyTreeEntities.getListOfCustomPropertyTreeEntities',
    description:
      'Find workspace tree entities where the definition is bound before changing its availability.',
    fields: {property_id: propertyId},
  },
} satisfies Record<string, CatalogRoute | readonly CatalogRoute[]>;

const definitionFields = {
  'body.show_on_facade': 'Show the field on the compact card front.',
  'body.multiline': 'Use a multiline editor for a text field.',
  'body.colorful': 'Enable per-value colors where supported by the type.',
  'body.multi_select': 'Allow multiple choices for an eligible field.',
  'body.values_creatable_by_users':
    'Allow ordinary card users to create options for this field.',
  'body.fields_settings': 'Native type-specific field settings.',
};

export const fieldWrites = {
  set_card_properties: {
    source: 'set_card_properties',
    description:
      'Change existing custom values on one card. Omitted keys keep their values. Null clears a value. Inspect the field definition and available values first.',
    fields: {
      card_id: cardProperty.card_id,
      properties:
        'Map keys are id_<numeric property ID>. Use the native shape for each type: text or number scalars, numeric select ID arrays, one catalog ID string, directory record UUID arrays, or a date object with date/time/tzOffset.',
    },
  },
  create_custom_property: {
    source: 'customProperties.createNewProperty',
    description:
      'Create a reusable field definition. Supply name and type, or a formula with formula_source_card to evaluate the formula context.',
    fields: {
      ...definitionFields,
      'body.type': 'Value kind and editor of the new field.',
      'body.formula': 'Formula expression for the formula creation form.',
      'body.formula_source_card':
        'Source card data used to resolve and validate formula references.',
      'body.vote_variant':
        'Choose rating, scale, or emoji_set for vote fields.',
      'body.values_type':
        'Choose numeric or text values when configured by the field type.',
      'body.data':
        'Type-specific restrictions, formula, score and voting settings.',
      'body.data.calculation_method':
        'Aggregate collective scores with average or sum.',
      'body.data.restrictions.maxFilesCount':
        'Maximum attachments allowed by this field.',
      'body.data.restrictions.filesExtensions':
        'Native filter for accepted file extensions.',
    },
  },
  update_custom_property: {
    source: 'customProperties.updateProperty',
    description:
      'Change an existing workspace field definition, display settings or availability. The change can affect cards using the field. Use set_card_properties for a value on one card.',
    fields: {
      property_id: propertyId,
      ...definitionFields,
      'body.condition':
        'Set inactive to disable the definition without issuing a delete.',
      'body.data':
        'Native settings specific to the field type. Read the definition before modifying these settings.',
      'body.is_used_as_progress':
        'Enable use of this field as a card progress indicator where supported.',
    },
  },
  delete_custom_property: {
    source: 'customProperties.removeProperty',
    description:
      'Remove a reusable field definition at workspace scope. Review where it is used with list_property_bindings. Use null in set_card_properties to clear only one card’s value.',
    fields: {property_id: propertyId},
  },
  bind_custom_property: {
    source: 'customPropertyTreeEntities.addTreeEntityToCustomProperty',
    description:
      'Make a field available in a tree entity. Resolve the target with kaiten_workspace_read.',
    fields: {
      property_id: propertyId,
      tree_entity_uid:
        'UID of the tree entity where the definition should be available.',
    },
  },
  unbind_custom_property: {
    source: 'customPropertyTreeEntities.deleteTreeEntityFromCustomProperty',
    description:
      'Remove a field availability binding for one tree entity while retaining the field definition.',
    fields: {
      property_id: propertyId,
      uid: 'Tree entity UID from list_property_bindings.',
    },
  },
  create_select_value: {
    source: 'customPropertySelectValues.createNewSelectValue',
    description:
      'Add a reusable option to a select field. Assign the returned option ID separately when editing a card.',
    fields: {
      property_id: propertyId,
      value: 'Label visible to users selecting this option.',
      color: 'Numeric Kaiten color code, or null for no explicit color.',
    },
  },
  update_select_value: {
    source: 'customPropertySelectValues.updateSelectValue',
    description:
      'Change an existing select option shared by cards using this field. Supply at least one change.',
    fields: {
      property_id: propertyId,
      value_id: selectId,
      'body.color': 'Numeric color code. Null clears the color.',
      'body.condition': 'Set inactive to disable the option.',
      'body.sort_order': 'Position among options for this property.',
      'body.deleted': 'Native deletion flag for the reusable option.',
    },
  },
  delete_select_value: {
    source: 'customPropertySelectValues.removeProperty',
    description:
      'Remove a reusable select option from this field. This targets an option across the workspace, not a single card assignment.',
    fields: {property_id: propertyId, value_id: selectId},
  },
  create_catalog_value: {
    source: 'customPropertyCatalogValues.createNewCatalogValue',
    description:
      'Add a new structured entry to a catalog property. Assign its returned ID separately on a card.',
    fields: {
      property_id: propertyId,
      'body.value':
        'JSON map of catalog entry fields defined by this property.',
    },
  },
  update_catalog_value: {
    source: 'customPropertyCatalogValues.updateCatalogValue',
    description:
      'Patch a reusable catalog entry. Supply condition or a new value map, with an optional deletion flag.',
    fields: {
      property_id: propertyId,
      value_id: catalogId,
      'body.value': 'JSON map of catalog entry fields.',
      'body.condition': 'Set inactive to disable the entry.',
      'body.deleted': 'Native deletion flag for this catalog entry.',
    },
  },
  delete_catalog_value: {
    source: 'customPropertyCatalogValues.removeProperty',
    description:
      'Remove a reusable catalog entry from this field. Use set_card_properties to change a card’s selected entry.',
    fields: {property_id: propertyId, value_id: catalogId},
  },
  add_collective_score: {
    source: 'customPropertyCollectiveScoreValues.createNewScoreValue',
    description:
      'Submit a score contribution to an existing collective score field on a card. Kaiten uses the field’s configured aggregation.',
    fields: {
      ...cardProperty,
      value: 'Score as a string, including numeric-looking scores.',
    },
  },
  update_collective_score: {
    source: 'customPropertyCollectiveScoreValues.updateScoreValue',
    description:
      'Change or clear one score contribution rather than writing the aggregate property.',
    fields: {
      ...cardProperty,
      value_id: 'Score record ID from list_collective_scores.',
      value: 'New score string. Null clears the score.',
    },
  },
  add_collective_vote: {
    source: 'customPropertyCollectiveVoteValues.createNewVoteValue',
    description:
      'Submit a vote to a card’s collective vote field. Match the form to the field’s voting settings.',
    fields: {
      ...cardProperty,
      'body.emoji_vote': 'Emoji value for an emoji vote.',
      'body.number_vote':
        'Numeric rating or scale value. Zero is forwarded when supplied.',
    },
  },
  update_collective_vote: {
    source: 'customPropertyCollectiveVoteValues.updateVoteValue',
    description:
      'Change an existing numeric vote. Specify null to clear its value.',
    fields: {
      ...cardProperty,
      id: 'Vote record ID from list_collective_votes.',
      number_vote: 'New numeric vote. Null clears it.',
    },
  },
  remove_collective_emoji_vote: {
    source: 'customPropertyCollectiveVoteValues.removeVoteValue',
    description: 'Remove the specified emoji vote from the card field.',
    fields: {
      ...cardProperty,
      id: 'Vote record ID from list_collective_votes.',
      emoji_vote: 'Exact emoji value to remove from that vote record.',
    },
  },
} satisfies Record<string, CatalogRoute>;
