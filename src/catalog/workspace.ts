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
    description: [
      'Discover Kaiten workspace structure, the connected account, access settings, card taxonomy and audit events.',
      '- Pass the numeric id from list_spaces as space_id to list_boards. Use get_board for one board’s layout, list_columns and list_lanes for placement IDs, and list_subcolumns with the parent column_id. Pair space_id and board_id for a space-scoped board lookup. Set format to native on get_space when an iteration call needs the space UID.',
      '- Resolve “my” with get_current_user. Find assignees with list_company_users. Use list_space_users with query.include_inherited_access set to true to see effective access, list_groups and list_group_access for group grants, and list_tree_entities for grant targets. list_tree_roles returns access role UIDs. list_user_roles supplies numeric time-log roles. Use list_scim_users and list_scim_groups for provisioning records.',
      '- Use list_card_types and list_workspace_tags for taxonomy. get_card_type returns optional description template text in result.description_template for card creation. Discover space checklist templates with kaiten_checklists_read list_checklist_templates. Task search belongs to kaiten_cards_read and card-specific participants and tags to kaiten_collaboration_read.',
      '- Use list_activity for a feed or scan_activity for a bounded snapshot. For the feed, keep space and filters fixed when passing next_cursor as query.cursor. query.card_id is for company scope, with space_id omitted. Audit logs use an offset. Audit logs and company activity depend on the Kaiten plan and token permissions.',
    ].join('\n'),
    operations: {
      ...layoutReads,
      ...accessReads,
      ...taxonomyReads,
      ...provisioningReads,
    },
  },
  workspace_write: {
    description: [
      'Change Kaiten workspace configuration and access. Use kaiten_cards_write for card changes and kaiten_collaboration_write for card participants and tags.',
      '- Resolve the target and owning space with kaiten_workspace_read. For a board move, use the destination as space_id and the source as body.move_from_space_id. For a space access patch, pair space_id with the user’s numeric id and include body.role_id or body.space_group_id alongside any notification changes.',
      '- Use update operations for routine renames or reordering. Omitted patch fields keep their values. Changes to grants, group membership and SCIM provisioning can alter access and require the corresponding Kaiten permissions. An invitation may send email. Add-on refresh uses the configured secret and returns a credential.',
      '- Check related cards before deleting layout. Setting force to true allows layout deletion to cascade to related data. To hide a lane, set body.condition to 2 with update_lane. Use replace_role_id or replace_type_id to select the replacement when deleting a role or card type. If a write times out, read the affected resource before retrying.',
    ].join('\n'),
    operations: {
      ...layoutWrites,
      ...accessWrites,
      ...taxonomyWrites,
      ...provisioningWrites,
    },
  },
};
