import {workspaceCases} from './workspace-cases.ts';
import {cardApiCases} from './card-api-cases.ts';

export const apiCases = [...workspaceCases, ...cardApiCases];

// These operations have dedicated protocol tests for local computation or pagination.
export const specialOperations = ['encodeCardFilter', 'cards.iterate'];
