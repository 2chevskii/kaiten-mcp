import type {ToolCase} from './tool-cases.ts';

const recipient = {
  card_id: 10,
  user_id: null,
  email: 'person+tag@example.com',
  unsubscribed: false,
  updater_id: 5,
};

export const serviceDeskCases: ToolCase[] = [
  {
    name: 'cardServiceDeskExternalRecipients.addNewRecipient',
    args: {card_id: 10, email: 'person+tag@example.com'},
    method: 'POST',
    path: '/cards/10/sd-external-recipients',
    body: {email: 'person+tag@example.com'},
    response: recipient,
  },
  {
    name: 'cardServiceDeskExternalRecipients.removeRecipient',
    args: {card_id: 10, email: 'person+tag@example.com'},
    method: 'DELETE',
    path: '/cards/10/sd-external-recipients/person%2Btag%40example.com',
    response: {...recipient, unsubscribed: true},
  },
  {
    name: 'cardSla.retrieveCardSlaMeasurements',
    args: {card_id: 10},
    method: 'GET',
    path: '/cards/10/sla-rules-measurements',
    response: {
      calendars: [
        {
          id: 'calendar-uid',
          timezone: 'Europe/Moscow',
          work_days: [],
          holidays: [],
        },
      ],
      rulesTimeData: [
        {
          rule_id: 'rule-uid',
          card_id: 10,
          actual_time: 0,
          started: true,
          completed: false,
        },
      ],
    },
  },
  {
    name: 'serviceDeskServices.retrieveServicesList',
    args: {},
    method: 'GET',
    path: '/service-desk/services',
    response: [
      {
        id: 7,
        name: 'Support',
        fields_settings: {custom: true},
        allow_to_add_external_recipients: true,
        settings: {allowed_email_masks: ['*@example.com']},
        board_id: 2,
        column_id: 3,
        lane_id: 4,
      },
    ],
  },
];
