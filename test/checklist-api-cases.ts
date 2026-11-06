import type {ToolCase} from './tool-cases.ts';

const item = {
  id: 9,
  text: 'Task',
  checked: false,
  due_date: null,
  responsible_id: null,
  extra: 'preserved',
};
const checklist = {
  id: 8,
  name: 'Tasks',
  items: [item],
  shared_cards: [{id: 20}],
};
const template = {
  uid: 'template-uid',
  name: 'Tasks',
  items: [{uid: 'item-uid', text: 'Task'}],
};
const templateRoot = '/spaces/space-uid/template-checklists';
const addBody = {
  text: 'Task',
  checked: false,
  due_date: null,
  responsible_id: 5,
  sort_order: 0,
};
const updateBody = {
  text: null,
  checked: false,
  due_date: null,
  responsible_id: null,
  sort_order: 0,
  checklist_id: 12,
};

const itemCases: ToolCase[] = [
  {
    name: 'cardChecklistItems.addItemToChecklist',
    args: {card_id: 10, checklist_id: 8, body: addBody},
    method: 'POST',
    path: '/cards/10/checklists/8/items',
    body: addBody,
    response: item,
  },
  {
    name: 'cardChecklistItems.updateChecklistItem',
    args: {card_id: 10, checklist_id: 8, item_id: 9, body: updateBody},
    method: 'PATCH',
    path: '/cards/10/checklists/8/items/9',
    body: updateBody,
    response: item,
  },
  {
    name: 'cardChecklistItems.removeChecklistItem',
    args: {card_id: 10, checklist_id: 8, item_id: 9},
    method: 'DELETE',
    path: '/cards/10/checklists/8/items/9',
    response: {id: 9},
  },
  {
    name: 'checklistItems.addItemToChecklist',
    args: {checklist_id: 8, body: addBody},
    method: 'POST',
    path: '/checklists/8/items',
    body: addBody,
    response: item,
  },
  {
    name: 'checklistItems.updateChecklistItem',
    args: {checklist_id: 8, item_id: 9, body: updateBody},
    method: 'PATCH',
    path: '/checklists/8/items/9',
    body: updateBody,
    response: item,
  },
  {
    name: 'checklistItems.removeChecklistItem',
    args: {checklist_id: 8, item_id: 9},
    method: 'DELETE',
    path: '/checklists/8/items/9',
    response: {id: 9},
  },
];

export const checklistApiCases: ToolCase[] = [
  ...itemCases,
  {
    name: 'cardChecklists.addChecklistToCard',
    args: {
      card_id: 10,
      body: {
        source_share_id: 11,
        items_source_checklist_id: 8,
        exclude_item_ids: [9],
        sort_order: 0,
      },
    },
    method: 'POST',
    path: '/cards/10/checklists',
    body: {
      source_share_id: 11,
      items_source_checklist_id: 8,
      exclude_item_ids: [9],
      sort_order: 0,
    },
    response: checklist,
  },
  {
    name: 'cardChecklists.retrieveCardChecklist',
    args: {card_id: 10, checklist_id: 8},
    method: 'GET',
    path: '/cards/10/checklists/8',
    response: checklist,
  },
  {
    name: 'cardChecklists.updateChecklist',
    args: {
      card_id: 10,
      checklist_id: 8,
      body: {name: 'New', card_id: 20, sort_order: 0},
    },
    method: 'PATCH',
    path: '/cards/10/checklists/8',
    body: {name: 'New', card_id: 20, sort_order: 0},
    response: checklist,
  },
  {
    name: 'cardChecklists.removeChecklistFromCard',
    args: {card_id: 10, checklist_id: 8},
    method: 'DELETE',
    path: '/cards/10/checklists/8',
    response: {id: 8},
  },
  {
    name: 'checklists.retrieveCardsWithChecklist',
    args: {id: 8, only_shared_cards: false},
    method: 'GET',
    path: '/checklists/8',
    query: {only_shared_cards: 'false'},
    response: [{id: 10}, {id: 20}],
  },
  {
    name: 'spaceTemplateChecklist.createNewSpaceTemplateChecklist',
    args: {space_uid: 'space-uid', name: 'Tasks', sort_order: 0},
    method: 'POST',
    path: templateRoot,
    body: {name: 'Tasks', sort_order: 0},
    response: template,
  },
  {
    name: 'spaceTemplateChecklist.getListOfSpaceTemplateChecklists',
    args: {space_uid: 'space-uid'},
    method: 'GET',
    path: templateRoot,
    response: [template],
  },
  {
    name: 'spaceTemplateChecklist.updateSpaceTemplateChecklist',
    args: {
      space_uid: 'space-uid',
      template_checklist_uid: 'template-uid',
      body: {name: 'New', space_uid: 'other-space', sort_order: 0},
    },
    method: 'PATCH',
    path: `${templateRoot}/template-uid`,
    body: {name: 'New', space_uid: 'other-space', sort_order: 0},
    response: template,
  },
  {
    name: 'spaceTemplateChecklist.removeSpaceTemplateChecklist',
    args: {space_uid: 'space-uid', template_checklist_uid: 'template-uid'},
    method: 'DELETE',
    path: `${templateRoot}/template-uid`,
    response: {uid: 'template-uid'},
  },
  {
    name: 'spaceTemplateChecklistItems.createNewSpaceTemplateChecklistItem',
    args: {
      space_uid: 'space-uid',
      template_checklist_uid: 'template-uid',
      text: 'Task',
      sort_order: 0,
    },
    method: 'POST',
    path: `${templateRoot}/template-uid/items`,
    body: {text: 'Task', sort_order: 0},
    response: {uid: 'item-uid', text: 'Task'},
  },
  {
    name: 'spaceTemplateChecklistItems.updateSpaceTemplateChecklistItem',
    args: {
      space_uid: 'space-uid',
      template_checklist_uid: 'template-uid',
      item_uid: 'item-uid',
      body: {text: 'New', sort_order: 0},
    },
    method: 'PATCH',
    path: `${templateRoot}/template-uid/items/item-uid`,
    body: {text: 'New', sort_order: 0},
    response: {uid: 'item-uid', text: 'New'},
  },
  {
    name: 'spaceTemplateChecklistItems.removeSpaceTemplateChecklistItem',
    args: {
      space_uid: 'space-uid',
      template_checklist_uid: 'template-uid',
      item_uid: 'item-uid',
    },
    method: 'DELETE',
    path: `${templateRoot}/template-uid/items/item-uid`,
    response: {uid: 'item-uid'},
  },
];
