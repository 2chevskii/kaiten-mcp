import type {ToolCase} from './tool-cases.ts';

const body = {
  type: 'on_action',
  name: 'Fixture automation',
  trigger: {
    type: 'card_created',
    hasToFireOnCardCreation: false,
    data: {path: [1, 2], enabled: false},
  },
  conditions: {
    clause: 'and',
    conditions: [
      {type: 'fixture', operator: 'eq', data: {value: 0}},
      {
        clause: 'or',
        conditions: [{type: 'nested', data: {value: null}}],
        created: 'opaque-created-value',
      },
    ],
  },
  actions: [{type: 'fixture-action', data: {enabled: false}}],
};
const response = {
  ...body,
  id: 'automation-uid',
  space_uid: 'space-uid',
  status: 'active',
  sort_order: 0,
};

export const automationCases: ToolCase[] = [
  {
    name: 'automations.getListOfAutomations',
    args: {space_id: 1},
    method: 'GET',
    path: '/spaces/1/automations',
    response: [response],
  },
  {
    name: 'automations.createAutomation',
    args: {space_id: 1, body},
    method: 'POST',
    path: '/spaces/1/automations',
    body,
    response,
  },
  {
    name: 'automations.updateAutomation',
    args: {
      space_id: 1,
      automation_uid: 'automation/uid',
      body: {actions: body.actions},
    },
    method: 'PATCH',
    path: '/spaces/1/automations/automation%2Fuid',
    body: {actions: body.actions},
    response,
  },
  {
    name: 'automations.deleteAutomation',
    args: {space_id: 1, automation_uid: 'automation-uid'},
    method: 'DELETE',
    path: '/spaces/1/automations/automation-uid',
    response: {message: 'Deleted'},
  },
];
