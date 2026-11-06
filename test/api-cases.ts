import {workspaceCases} from './workspace-cases.ts';
import {cardApiCases} from './card-api-cases.ts';
import {cardRelationCases} from './card-relation-cases.ts';

export const apiCases = [
  ...workspaceCases,
  ...cardApiCases,
  ...cardRelationCases,
];

// These operations have dedicated protocol tests for local computation or pagination.
export const specialOperations = ['encodeCardFilter', 'cards.iterate'];
