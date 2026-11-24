import type {CatalogDefinition} from '../catalog.ts';
import {cardsCatalog} from './cards.ts';
import {checklistsCatalog} from './checklists.ts';
import {collaborationCatalog} from './collaboration.ts';
import {contentCatalog} from './content.ts';
import {customPropertiesCatalog} from './custom-properties.ts';
import {workflowsCatalog} from './workflows.ts';
import {workspaceCatalog} from './workspace.ts';

export const canonicalCatalog: CatalogDefinition = {
  ...workspaceCatalog,
  ...cardsCatalog,
  ...collaborationCatalog,
  ...checklistsCatalog,
  ...customPropertiesCatalog,
  ...contentCatalog,
  ...workflowsCatalog,
};
