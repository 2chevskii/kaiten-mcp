import type {ToolCase} from './tool-cases.ts';

const type = {
  id: 7,
  uid: 'type-uid',
  name: 'Task',
  letter: 'T',
  color: 0,
  card_properties: [{regular_property: 'due_date', required: false}],
};
const tree = {uid: 'entity-uid', entity_type: 'space', access: 'own'};
const tag = {id: 8, name: 'Urgent', color: 0, archived: false};

export const taxonomyCases: ToolCase[] = [
  {
    name: 'cardTypes.createNewCardType',
    args: {
      body: {
        name: 'Task',
        letter: 'T',
        color: 0,
        card_properties: [{regular_property: 'due_date', required: false}],
        suggest_fields: false,
      },
    },
    method: 'POST',
    path: '/card-types',
    body: {
      name: 'Task',
      letter: 'T',
      color: 0,
      card_properties: [{regular_property: 'due_date', required: false}],
      suggest_fields: false,
    },
    response: type,
  },
  {
    name: 'cardTypes.getCardType',
    args: {id: 7},
    method: 'GET',
    path: '/card-types/7',
    response: type,
  },
  {
    name: 'cardTypes.getListOfCardTypes',
    args: {limit: 2, offset: 0},
    method: 'GET',
    path: '/card-types',
    query: {limit: '2', offset: '0'},
    response: [type],
  },
  {
    name: 'cardTypes.updateCardType',
    args: {
      id: 7,
      body: {
        name: 'New',
        card_properties: [
          {
            regular_property: null,
            property_uid: 'property-uid',
            required: false,
          },
        ],
        suggest_fields: false,
      },
    },
    method: 'PATCH',
    path: '/card-types/7',
    body: {
      name: 'New',
      card_properties: [
        {regular_property: null, property_uid: 'property-uid', required: false},
      ],
      suggest_fields: false,
    },
    response: type,
  },
  {
    name: 'cardTypes.removeCardType',
    args: {id: 7, replace_type_id: 9},
    method: 'DELETE',
    path: '/card-types/7',
    body: {replace_type_id: 9},
    response: type,
  },
  {
    name: 'cardTypeTreeEntities.addTreeEntityToCardType',
    args: {type_id: 7, tree_entity_uid: 'entity-uid'},
    method: 'POST',
    path: '/card-types/7/tree-entities',
    body: {tree_entity_uid: 'entity-uid'},
    response: tree,
  },
  {
    name: 'cardTypeTreeEntities.getListOfTypeTreeEntities',
    args: {type_id: 7},
    method: 'GET',
    path: '/card-types/7/tree-entities',
    response: [tree],
  },
  {
    name: 'cardTypeTreeEntities.deleteTreeEntityFromCardType',
    args: {type_id: 7, uid: 'entity-uid'},
    method: 'DELETE',
    path: '/card-types/7/tree-entities/entity-uid',
    status: 204,
    response: null,
  },
  {
    name: 'tags.addTag',
    args: {name: 'Urgent', query: {space_id: 1}},
    method: 'POST',
    path: '/tags',
    query: {space_id: '1'},
    body: {name: 'Urgent'},
    response: tag,
  },
  {
    name: 'tags.retrieveListOfTags',
    args: {
      query: {ids: [8, 9], space_id: 1, query: 'Urgent', limit: 2, offset: 0},
    },
    method: 'GET',
    path: '/tags',
    query: {
      ids: '8,9',
      space_id: '1',
      query: 'Urgent',
      limit: '2',
      offset: '0',
    },
    response: [tag],
  },
];
