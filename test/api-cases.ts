import {workspaceCases} from './workspace-cases.ts';
import {cardApiCases} from './card-api-cases.ts';
import {cardRelationCases} from './card-relation-cases.ts';
import {identityCases} from './identity-cases.ts';

export const apiCases = [
  ...workspaceCases,
  ...cardApiCases,
  ...cardRelationCases,
  ...identityCases,
];

// These operations have dedicated protocol tests for local computation or pagination.
export const specialOperations = [
  'encodeCardFilter',
  'cards.iterate',
  'users.iterate',
];
