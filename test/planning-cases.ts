import type {ToolCase} from './tool-cases.ts';

const iteration = {
  id: 'iteration-id',
  space_uid: 'space-uid',
  title: 'Iteration',
  status: 'planned',
  data: {preserved: true},
};
const membership = {
  iteration_id: 'iteration-id',
  card_uid: 'card-uid',
  card_id: 10,
  removed_at: null,
};
const sprint = {
  id: 9,
  uid: 'sprint-uid',
  title: 'Legacy sprint',
  velocity_details: {by_members: []},
};
const root = '/spaces/space-uid/iterations';

export const planningCases: ToolCase[] = [
  {
    name: 'iterations.createIteration',
    args: {
      space_uid: 'space-uid',
      body: {
        title: 'Iteration',
        goal: null,
        start_date: '2026-11-01',
        finish_date: '2026-11-14',
      },
    },
    method: 'POST',
    path: root,
    body: {
      title: 'Iteration',
      goal: null,
      start_date: '2026-11-01',
      finish_date: '2026-11-14',
    },
    response: iteration,
  },
  {
    name: 'iterations.getIteration',
    args: {space_uid: 'space-uid', id: 'iteration-id'},
    method: 'GET',
    path: `${root}/iteration-id`,
    response: iteration,
  },
  {
    name: 'iterations.retrieveListOfIterations',
    args: {
      space_uid: 'space-uid',
      query: {
        status: 'active',
        with_data: 'true',
        limit: 2,
        offset: 0,
        order: 'desc',
      },
    },
    method: 'GET',
    path: root,
    query: {
      status: 'active',
      with_data: 'true',
      limit: '2',
      offset: '0',
      order: 'desc',
    },
    response: [iteration],
  },
  {
    name: 'iterations.updateIteration',
    args: {
      space_uid: 'space-uid',
      id: 'iteration-id',
      body: {
        status: 'closed',
        goal: null,
        actual_finish_date: '2026-11-06',
        new_iteration_id: 'replacement-id',
      },
    },
    method: 'PATCH',
    path: `${root}/iteration-id`,
    body: {
      status: 'closed',
      goal: null,
      actual_finish_date: '2026-11-06',
      new_iteration_id: 'replacement-id',
    },
    response: {...iteration, moved_cards: 2},
  },
  {
    name: 'iterations.deleteIteration',
    args: {space_uid: 'space-uid', id: 'iteration-id', new_iteration_id: null},
    method: 'DELETE',
    path: `${root}/iteration-id`,
    body: {new_iteration_id: null},
    response: iteration,
  },
  {
    name: 'iterations.addCardToIteration',
    args: {
      space_uid: 'space-uid',
      iteration_id: 'iteration-id',
      card_uid: 'card-uid',
    },
    method: 'POST',
    path: `${root}/iteration-id/cards`,
    body: {card_uid: 'card-uid'},
    response: membership,
  },
  {
    name: 'iterations.retrieveCardsInIteration',
    args: {
      space_uid: 'space-uid',
      iteration_id: 'iteration-id',
      status: 'active',
    },
    method: 'GET',
    path: `${root}/iteration-id/cards`,
    query: {status: 'active'},
    response: [membership],
  },
  {
    name: 'iterations.removeCardFromIteration',
    args: {
      space_uid: 'space-uid',
      iteration_id: 'iteration-id',
      uid: 'card-uid',
    },
    method: 'DELETE',
    path: `${root}/iteration-id/cards/card-uid`,
    response: {...membership, removed_at: '2026-11-06T12:00:00Z'},
  },
  {
    name: 'iterations.getCardIterationsHistory',
    args: {card_uid: 'card-uid', with_details: false},
    method: 'GET',
    path: '/cards/card-uid/iterations-history',
    query: {with_details: 'false'},
    response: [membership],
  },
  {
    name: 'sprints.getSprintSummary',
    args: {id: 9, exclude_deleted_cards: false},
    method: 'GET',
    path: '/sprints/9',
    query: {exclude_deleted_cards: 'false'},
    response: sprint,
  },
  {
    name: 'sprints.getSprintsList',
    args: {active: false, limit: 2, offset: 0},
    method: 'GET',
    path: '/sprints',
    query: {active: 'false', limit: '2', offset: '0'},
    response: [sprint],
  },
];
