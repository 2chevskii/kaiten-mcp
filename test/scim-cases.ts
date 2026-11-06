import type {ToolCase} from './tool-cases.ts';

const user = {
  id: 5,
  userName: 'user@example.com',
  active: true,
  name: {givenName: 'A', familyName: 'User'},
};
const group = {id: 'group-id', displayName: 'Team', members: [{value: 5}]};
const page = (item: unknown) => ({
  schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
  Resources: [item],
  totalResults: 1,
  itemsPerPage: 1,
  startIndex: 0,
});

export const scimCases: ToolCase[] = [
  {
    name: 'scim.groups.addGroup',
    args: {display_name: 'Team'},
    method: 'POST',
    path: '/Groups',
    body: {displayName: 'Team'},
    response: group,
  },
  {
    name: 'scim.groups.getGroup',
    args: {group_id: 'group-id'},
    method: 'GET',
    path: '/Groups/group-id',
    response: group,
  },
  {
    name: 'scim.groups.getGroups',
    args: {start_index: 1, count: 20},
    method: 'GET',
    path: '/Groups',
    query: {startIndex: '1', count: '20'},
    response: page(group),
  },
  {
    name: 'scim.groups.updateGroup',
    args: {
      group_id: 'group-id',
      operations: [
        {op: 'add', path: 'members', value: 5},
        {op: 'replace', path: 'displayName', value: 'New'},
      ],
    },
    method: 'PATCH',
    path: '/Groups/group-id',
    body: {
      Operations: [
        {op: 'add', path: 'members', value: 5},
        {op: 'replace', path: 'displayName', value: 'New'},
      ],
    },
    response: group,
  },
  {
    name: 'scim.users.addUser',
    args: {
      body: {
        userName: 'user@example.com',
        name: {givenName: 'A'},
        emails: {value: 'user@example.com', primary: true},
      },
    },
    method: 'POST',
    path: '/Users',
    body: {
      userName: 'user@example.com',
      name: {givenName: 'A'},
      emails: {value: 'user@example.com', primary: true},
    },
    response: user,
  },
  {
    name: 'scim.users.getUser',
    args: {user_id: 5},
    method: 'GET',
    path: '/Users/5',
    response: user,
  },
  {
    name: 'scim.users.getUsers',
    args: {start_index: 1, count: 20, filter: 'userName eq "user@example.com"'},
    method: 'GET',
    path: '/Users',
    query: {
      startIndex: '1',
      count: '20',
      filter: 'userName eq "user@example.com"',
    },
    response: page(user),
  },
  {
    name: 'scim.users.updateUser',
    args: {
      user_id: 5,
      operations: [
        {op: 'replace', path: 'active', value: false},
        {op: 'replace', path: 'name.givenName', value: 'New'},
        {op: 'remove', path: 'name.familyName'},
      ],
    },
    method: 'PATCH',
    path: '/Users/5',
    body: {
      Operations: [
        {op: 'replace', path: 'active', value: false},
        {op: 'replace', path: 'name.givenName', value: 'New'},
        {op: 'remove', path: 'name.familyName'},
      ],
    },
    response: user,
  },
].map(item => ({...item, api_prefix: '/scim/v2'}));
