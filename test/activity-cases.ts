import type {ToolCase} from './tool-cases.ts';

export const activityCases: ToolCase[] = [
  {
    name: 'auditLogs.retrieveAuditLogEvents',
    args: {
      query: {
        from: '2026-01-01',
        to: '2026-02-01',
        author_id: 5,
        author_uid: 'author-uid',
        categories: 'users,spaces',
        actions: 'create,delete',
        id: 'event-uid',
        limit: 2,
        offset: 0,
      },
    },
    method: 'GET',
    path: '/audit-logs',
    query: {
      from: '2026-01-01',
      to: '2026-02-01',
      author_id: '5',
      author_uid: 'author-uid',
      categories: 'users,spaces',
      actions: 'create,delete',
      id: 'event-uid',
      limit: '2',
      offset: '0',
    },
    response: [
      {
        id: 'event-uid',
        details: {nested: [false, null]},
        author_remote_address: null,
      },
    ],
  },
  {
    name: 'activity.listCompanyActivity',
    args: {
      query: {
        limit: 2,
        cursor: 'opaque+/=',
        actions: 'card_created,card_moved',
        author_id: 5,
        card_id: 10,
        created_after: '2026-01-01',
        created_before: '2026-02-01',
      },
    },
    method: 'GET',
    path: '/company/activity',
    query: {
      limit: '2',
      cursor: 'opaque+/=',
      actions: 'card_created,card_moved',
      author_id: '5',
      card_id: '10',
      created_after: '2026-01-01',
      created_before: '2026-02-01',
    },
    response: {
      items: [{id: 'event', extra: {retained: true}}],
      limit: 2,
      next_cursor: 'next+/=',
    },
  },
  {
    name: 'activity.listSpaceActivity',
    args: {space_id: 1, query: {cursor: '', limit: 1}},
    method: 'GET',
    path: '/spaces/1/activity',
    query: {cursor: '', limit: '1'},
    response: {items: [], limit: 1, next_cursor: null},
  },
];
