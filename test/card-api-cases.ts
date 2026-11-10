import type {ToolCase} from './tool-cases.ts';

const card = {
  id: 10,
  uid: 'card-uid',
  description: 'Full description',
  extra: {preserved: true},
};
const creation = {
  title: 0,
  board_id: 2,
  responsible_id: 5,
  owner_email: 'owner@example.com',
  position: 2,
  service_id: null,
  text_format_type_id: 2,
  properties: {id_7: ['value']},
};

export const cardApiCases: ToolCase[] = [
  {
    name: 'cards.createNewCard',
    args: {body: creation},
    method: 'POST',
    path: '/cards',
    body: creation,
    response: card,
  },
  {
    name: 'cards.create',
    args: {body: creation},
    method: 'POST',
    path: '/cards',
    body: creation,
    response: card,
  },
  {
    name: 'cards.updateCard',
    args: {
      card_id: 10,
      body: {
        estimate_workload: 0,
        ignore_planned_dates_recalculation: false,
        prev_card_id: 9,
        sd_new_comment: false,
        text_format_type_id: 3,
        external_id: null,
      },
    },
    method: 'PATCH',
    path: '/cards/10',
    body: {
      estimate_workload: 0,
      ignore_planned_dates_recalculation: false,
      prev_card_id: 9,
      sd_new_comment: false,
      text_format_type_id: 3,
      external_id: null,
    },
    response: card,
  },
  {
    name: 'cards.retrieveCard',
    args: {card_id: 10, broken_api: false},
    method: 'GET',
    path: '/cards/10',
    query: {broken_api: 'false'},
    response: card,
  },
  {
    name: 'cards.deleteCard',
    args: {card_id: 10},
    method: 'DELETE',
    path: '/cards/10',
    response: card,
  },
  {
    name: 'cards.retrieveCardBaselines',
    args: {card_id: 10},
    method: 'GET',
    path: '/cards/10/baselines',
    response: [{uid: 'baseline', project: {uid: 'project'}}],
  },
  {
    name: 'cards.retrieveCardLocationHistory',
    args: {card_id: 10},
    method: 'GET',
    path: '/cards/10/location-history',
    response: [{id: 'history', card_id: 10, author: {id: 5}}],
  },
  {
    name: 'cards.batchUpdateForCards',
    args: {
      body: {
        board_id: 2,
        attributes: {asap: false, service_id: null, title: 'Bulk'},
      },
    },
    method: 'PATCH',
    path: '/cards',
    body: {
      board_id: 2,
      attributes: {asap: false, service_id: null, title: 'Bulk'},
    },
    response: {id: 'job-id'},
  },
  {
    name: 'cards.retrieveCardList',
    args: {
      query: {
        version: 2,
        start_position: 'opaque-cursor',
        exclude_board_ids: [1, 2],
        additional_card_fields: ['description'],
        include_search_preview: false,
        done_on_time: false,
        order_by: ['title'],
        order_direction: ['desc'],
      },
    },
    method: 'GET',
    path: '/cards',
    query: {
      version: '2',
      start_position: 'opaque-cursor',
      exclude_board_ids: '1,2',
      additional_card_fields: 'description',
      include_search_preview: 'false',
      done_on_time: 'false',
      order_by: 'title',
      order_direction: 'desc',
    },
    response: {result: [card], position: 'next-position'},
  },
];
