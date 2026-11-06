import assert from 'node:assert/strict';
import {test} from 'node:test';
import {KaitenClient} from '@2chevskii/kaiten-client';
import {KaitenScimClient} from '@2chevskii/kaiten-client/scim';
import {startHarness} from './harness.ts';

test('advanced operations cover every public method in the implemented client domains', async context => {
  const harness = await startHarness(context);
  const client = new KaitenClient({
    origin: 'https://example.invalid',
    token: 'fixture',
  });
  for (const resource of [
    'spaces',
    'spaceBoards',
    'boards',
    'columns',
    'subcolumn',
    'lanes',
    'cards',
    'cardAllowedUsers',
    'cardBlockerCategories',
    'cardBlockerUsers',
    'cardBlockers',
    'cardPlannedRelations',
    'cardMembers',
    'cardTags',
    'cardChildren',
    'cardExternalLinks',
    'companyUsers',
    'users',
    'groups',
    'groupAdmins',
    'groupEntities',
    'groupUsers',
    'userRoles',
    'spaceUsers',
    'treeEntities',
    'treeEntityRoles',
    'cardTypes',
    'cardTypeTreeEntities',
    'tags',
    'customProperties',
    'customPropertyCatalogValues',
    'customPropertyCollectiveScoreValues',
    'customPropertyCollectiveVoteValues',
    'customPropertySelectValues',
    'customPropertyTreeEntities',
    'customDirectories',
    'customDirectoryFields',
    'customDirectoryRecords',
    'cardChecklists',
    'cardChecklistItems',
    'checklistItems',
    'checklists',
    'spaceTemplateChecklist',
    'spaceTemplateChecklistItems',
    'cardTimeLogs',
    'timesheet',
  ] as const) {
    for (const method of Object.keys(client[resource])) {
      assert.ok(
        harness.operations.has(`${resource}.${method}`),
        `${resource}.${method} is missing`,
      );
    }
  }
  const scim = new KaitenScimClient({
    origin: 'https://example.invalid',
    token: 'fixture',
  });
  for (const resource of ['users', 'groups'] as const) {
    for (const method of Object.keys(scim[resource])) {
      assert.ok(
        harness.operations.has(`scim.${resource}.${method}`),
        `scim.${resource}.${method} is missing`,
      );
    }
  }
});
