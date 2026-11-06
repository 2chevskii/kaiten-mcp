import {workspaceCases} from './workspace-cases.ts';
import {cardApiCases} from './card-api-cases.ts';
import {cardRelationCases} from './card-relation-cases.ts';
import {identityCases} from './identity-cases.ts';
import {scimCases} from './scim-cases.ts';
import {taxonomyCases} from './taxonomy-cases.ts';
import {propertyCases} from './property-cases.ts';
import {directoryCases} from './directory-cases.ts';
import {checklistApiCases} from './checklist-api-cases.ts';
import {timeCases} from './time-cases.ts';
import {planningCases} from './planning-cases.ts';
import {serviceDeskCases} from './service-desk-cases.ts';
import {documentCases} from './document-cases.ts';
import {automationCases} from './automation-cases.ts';
import {activityCases} from './activity-cases.ts';

export const apiCases = [
  ...workspaceCases,
  ...cardApiCases,
  ...cardRelationCases,
  ...identityCases,
  ...scimCases,
  ...taxonomyCases,
  ...propertyCases,
  ...directoryCases,
  ...checklistApiCases,
  ...timeCases,
  ...planningCases,
  ...serviceDeskCases,
  ...documentCases,
  ...automationCases,
  ...activityCases,
];

// These operations have dedicated protocol tests for local computation or pagination.
export const specialOperations = [
  'encodeCardFilter',
  'cards.iterate',
  'users.iterate',
  'scim.users.iterate',
  'scim.groups.iterate',
  'tags.iterate',
  'documents.iterate',
  'documentGroups.iterate',
  'activity.iterateCompanyActivity',
  'activity.iterateSpaceActivity',
  'sendCardWebhook',
  'addonOAuth.getToken',
  'addonOAuth.refreshToken',
];
