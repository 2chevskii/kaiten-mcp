import type {CatalogDefinition, CatalogRoute} from '../catalog.ts';
import {nativeResult} from './data/native-result.ts';

const cardId = 'Numeric card ID from kaiten_cards_read.';
const checklistId =
  'Numeric checklist ID from list_checklists for the source card, or the known shared checklist ID for global item calls.';
const itemId = 'Numeric item ID from get_checklist for this checklist.';
const order = 'Position relative to other entries in the same list.';
const dueDate =
  'ISO date or date-time with timezone. Null clears an existing due date on update.';
const responsible =
  'Numeric Kaiten user ID from kaiten_workspace_read. Null clears the assignee on update.';
const checkFields = {card_id: cardId, checklist_id: checklistId};
const itemFields = {...checkFields, item_id: itemId};
const bodyItemFields = {
  'body.text': 'Text of the item. On update, null clears the text.',
  'body.sort_order': order,
  'body.checked': 'True completes the item. False reopens it.',
  'body.due_date': dueDate,
  'body.responsible_id': responsible,
};
const bodyItemChanges = {
  ...bodyItemFields,
  'body.checklist_id':
    'Destination checklist ID when moving the item. Omit to keep it in the source checklist.',
};
const spaceUid =
  'String space UID from workspace metadata. Obtain it with get_space in native format.';
const templateUid =
  'String template UID from list_checklist_templates for this space.';
const templateItemUid =
  'String item UID in this template, distinct from a numeric card checklist item ID.';
const templateFields = {
  space_uid: spaceUid,
  template_checklist_uid: templateUid,
};
const templateItemFields = {...templateFields, item_uid: templateItemUid};

const reads: Record<string, CatalogRoute | readonly CatalogRoute[]> = {
  list_checklists: {
    source: 'list_checklists',
    description:
      'Find checklist IDs on a card. The server fetches the card’s checklist references and slices that list locally.',
    fields: {
      card_id: cardId,
      limit: 'Maximum references returned in this page.',
      offset:
        'Zero-based position in the card’s checklist list. Use next_offset with the same card until it is null.',
    },
  },
  get_checklist: [
    {
      source: 'get_checklist',
      description:
        'Load item text, completion, order, due dates and assignments for a checklist on a card.',
      fields: checkFields,
    },
    nativeResult({
      source: 'cardChecklists.retrieveCardChecklist',
      description:
        'Read complete checklist and item metadata for the same card and checklist.',
      fields: checkFields,
    }),
  ],
  list_cards_using_checklist: {
    source: 'checklists.retrieveCardsWithChecklist',
    description:
      'Find cards that use a checklist before editing shared items. Use only_shared_cards to restrict the result to cards sharing the checklist.',
    fields: {
      id: checklistId,
      only_shared_cards: 'When true, restrict the lookup to shared cards.',
    },
  },
  list_checklist_templates: {
    source: 'spaceTemplateChecklist.getListOfSpaceTemplateChecklists',
    description:
      'List reusable checklist templates and their items within one space, including the UIDs needed to edit them. The endpoint returns the space’s list in a single call.',
    fields: {space_uid: spaceUid},
  },
};

const writes: Record<string, CatalogRoute | readonly CatalogRoute[]> = {
  create_checklist: [
    {
      source: 'create_checklist',
      description: 'Create an empty, named checklist on a card.',
      fields: {
        card_id: cardId,
        name: 'Name displayed on the destination card.',
      },
    },
    {
      source: 'cardChecklists.addChecklistToCard',
      description:
        'Create, copy or share a checklist on the destination card. Provide name for a new checklist or source_share_id to share an existing checklist.',
      fields: {
        card_id: cardId,
        'body.name': 'Name of the new or copied checklist.',
        'body.sort_order': order,
        'body.items_source_checklist_id':
          'Existing checklist ID to copy items from.',
        'body.exclude_item_ids':
          'Source item IDs to skip when items_source_checklist_id is supplied.',
        'body.source_share_id':
          'Numeric ID of the existing checklist to share on the destination card.',
      },
    },
  ],
  update_checklist: [
    {
      source: 'update_checklist',
      description: 'Rename or reorder a checklist in its current card.',
      fields: {...checkFields, 'changes.sort_order': order},
    },
    {
      source: 'cardChecklists.updateChecklist',
      description:
        'Update a checklist with the native response, or move it from its current card to another card.',
      fields: {
        ...checkFields,
        'body.card_id':
          'Destination card ID for a move. Top-level card_id identifies the source.',
        'body.sort_order': order,
      },
    },
  ],
  delete_checklist: [
    {
      source: 'delete_checklist',
      description:
        'Remove the checklist and its visible items from the specified card. Check which cards use a shared checklist before removing its association.',
      fields: checkFields,
    },
    nativeResult({
      source: 'cardChecklists.removeChecklistFromCard',
      description:
        'Remove the checklist association from the specified card and retain the complete deletion response.',
      fields: checkFields,
    }),
  ],
  add_checklist_item: [
    {
      source: 'add_checklist_item',
      description:
        'Add an item to a checklist on a known card, with an optional due date and assignee.',
      fields: {
        ...checkFields,
        sort_order: order,
        checked: 'Set true to create a completed item.',
        due_date: 'ISO date or date-time with timezone for the new item.',
        responsible_id: 'Numeric Kaiten user ID from kaiten_workspace_read.',
      },
    },
    {
      source: 'cardChecklistItems.addItemToChecklist',
      description:
        'Add an item in a card-scoped checklist with a native body and complete item metadata.',
      fields: {...checkFields, ...bodyItemFields},
    },
    {
      source: 'checklistItems.addItemToChecklist',
      description:
        'Add an item by known checklist ID. Omit card_id for the global checklist endpoint, including shared checklists.',
      fields: {checklist_id: checklistId, ...bodyItemFields},
    },
  ],
  update_checklist_item: [
    {
      source: 'update_checklist_item',
      description:
        'Change completion or patch one or more fields on a card checklist item. Omitted fields keep their values.',
      fields: {
        ...itemFields,
        'changes.checked': 'True completes the item. False reopens it.',
        'changes.text': 'New item text. Null clears it.',
        'changes.sort_order': order,
        'changes.due_date': dueDate,
        'changes.responsible_id': responsible,
      },
    },
    {
      source: 'cardChecklistItems.updateChecklistItem',
      description:
        'Patch the card-scoped item with a native body, including moves to another checklist.',
      fields: {...itemFields, ...bodyItemChanges},
    },
    {
      source: 'checklistItems.updateChecklistItem',
      description:
        'Patch an item by checklist and item ID when operating on the checklist itself. Other cards sharing the checklist can see the update.',
      fields: {checklist_id: checklistId, item_id: itemId, ...bodyItemChanges},
    },
  ],
  delete_checklist_item: [
    {
      source: 'delete_checklist_item',
      description:
        'Delete an item from the checklist on the specified card. Verify the target item before deleting.',
      fields: itemFields,
    },
    nativeResult({
      source: 'cardChecklistItems.removeChecklistItem',
      description:
        'Delete the card-scoped checklist item and retain the full deletion response.',
      fields: itemFields,
    }),
    {
      source: 'checklistItems.removeChecklistItem',
      description:
        'Delete an item by checklist ID when acting on the checklist itself. Removing a shared item affects cards using that checklist.',
      fields: {checklist_id: checklistId, item_id: itemId},
    },
  ],
  create_checklist_template: {
    source: 'spaceTemplateChecklist.createNewSpaceTemplateChecklist',
    description:
      'Create a reusable checklist template in a space. Add template items separately.',
    fields: {space_uid: spaceUid, sort_order: order},
  },
  update_checklist_template: {
    source: 'spaceTemplateChecklist.updateSpaceTemplateChecklist',
    description:
      'Rename or reorder a reusable template. Include a name or order change when moving it to another space.',
    fields: {
      ...templateFields,
      'body.space_uid':
        'Destination space UID for a move. The top-level space_uid identifies the source.',
      'body.sort_order': order,
    },
  },
  delete_checklist_template: {
    source: 'spaceTemplateChecklist.removeSpaceTemplateChecklist',
    description:
      'Remove the reusable template from this space, so it is no longer available for future use there. Use delete_checklist for an existing card checklist.',
    fields: templateFields,
  },
  add_checklist_template_item: {
    source: 'spaceTemplateChecklistItems.createNewSpaceTemplateChecklistItem',
    description: 'Add a default item to the reusable template for future use.',
    fields: {...templateFields, sort_order: order},
  },
  update_checklist_template_item: {
    source: 'spaceTemplateChecklistItems.updateSpaceTemplateChecklistItem',
    description: 'Change text or order of a reusable template item.',
    fields: {...templateItemFields, 'body.sort_order': order},
  },
  delete_checklist_template_item: {
    source: 'spaceTemplateChecklistItems.removeSpaceTemplateChecklistItem',
    description: 'Remove a default item from the reusable space template.',
    fields: templateItemFields,
  },
};

export const checklistsCatalog: CatalogDefinition = {
  checklists_read: {
    description:
      'Read checklists, items and reusable space templates in Kaiten. Use list_checklists after resolving a card ID, then get_checklist with the returned checklist ID to see all item details. list_checklists slices one fetched card locally and returns next_offset. Choose list_cards_using_checklist to check where a shared checklist is used, or list_checklist_templates for defaults set on a space UID. Kaiten checks access to the source card or space.',
    operations: reads,
  },
  checklists_write: {
    description:
      'Create, copy, share, move and edit Kaiten checklists and checklist items. Resolve the card via kaiten_cards_read and checklist and item IDs via kaiten_checklists_read before writing. Choose template operations to change reusable defaults using space, template and item UIDs. Template changes require write access in that space. Omit patch fields to retain them and use null to clear supported item values. Check cards using a shared checklist before deleting or modifying its items.',
    operations: writes,
  },
};
