import type {CatalogDefinition} from '../catalog.ts';
import {accessReads, accessWrites} from './workspace/access.ts';
import {layoutReads, layoutWrites} from './workspace/layout.ts';
import {
  provisioningReads,
  provisioningWrites,
} from './workspace/provisioning.ts';
import {taxonomyReads, taxonomyWrites} from './workspace/taxonomy.ts';

export const workspaceCatalog: CatalogDefinition = {
  workspace_read: {
    description:
      'Discover Kaiten workspace structure, the connected account, access settings, card taxonomy, and audit events. Start with list_spaces, then list_boards and get_board to resolve card placement IDs. Use get_current_user to resolve “my” before searching cards. Use list_space_users to inspect access to a space, company and directory queries for Kaiten accounts, and SCIM queries for provisioning records. Activity pages have an opaque cursor; audit logs use an offset. Use list_activity for a resumable feed and scan_activity for a bounded snapshot. Use kaiten_cards_read for task search and kaiten_collaboration_read for people or tags attached to a card.',
    operations: {
      ...layoutReads,
      ...accessReads,
      ...taxonomyReads,
      ...provisioningReads,
    },
  },
  workspace_write: {
    description:
      'Administer Kaiten spaces, board layout, access, card taxonomy, and provisioning. Resolve the owning space and exact target IDs with kaiten_workspace_read first. Workspace and company restrictions are enforced by the configured account; company access changes require the corresponding Kaiten permissions. Omitted patch fields keep their values. Layout deletion with force cascades to related data, and role or card type deletion requires a replacement. Moving a task and updating its content belong to kaiten_cards_write; changing members or tags on a task belongs to kaiten_collaboration_write. After a timeout, read the affected resource before retrying a write.',
    operations: {
      ...layoutWrites,
      ...accessWrites,
      ...taxonomyWrites,
      ...provisioningWrites,
    },
  },
};
