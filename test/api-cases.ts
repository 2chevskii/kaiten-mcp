import {workspaceCases} from './workspace-cases.ts';
import {cardApiCases} from './card-api-cases.ts';
import {cardRelationCases} from './card-relation-cases.ts';
import {identityCases} from './identity-cases.ts';
import {scimCases} from './scim-cases.ts';
import {taxonomyCases} from './taxonomy-cases.ts';

export const apiCases = [
  ...workspaceCases,
  ...cardApiCases,
  ...cardRelationCases,
  ...identityCases,
  ...scimCases,
  ...taxonomyCases,
];

// These operations have dedicated protocol tests for local computation or pagination.
export const specialOperations = [
  'encodeCardFilter',
  'cards.iterate',
  'users.iterate',
  'scim.users.iterate',
  'scim.groups.iterate',
  'tags.iterate',
];
