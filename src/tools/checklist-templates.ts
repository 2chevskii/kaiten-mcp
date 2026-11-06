import * as z from 'zod/v4';
import {hasChanges, id, text} from '../schemas.ts';
import {read, change, type ToolRegistry} from '../tool-registry.ts';
import {apiResult} from '../results.ts';

export function registerChecklistTemplates(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'cardChecklistItems.addItemToChecklist',
    'Add item to checklist (cardChecklistItems); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      checklist_id: id,
      body: z.strictObject({
        text: z.string(),
        sort_order: z.number().optional(),
        checked: z.boolean().optional(),
        due_date: z.string().nullable().optional(),
        responsible_id: id.optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardChecklistItems.addItemToChecklist(
        args.card_id,
        args.checklist_id,
        args.body as Parameters<
          typeof client.cardChecklistItems.addItemToChecklist
        >[2],
        options,
      ),
    }),
  );
  registry.add(
    'cardChecklistItems.removeChecklistItem',
    'Remove checklist item (cardChecklistItems); full API fields and JSON response.',
    z.strictObject({card_id: id, checklist_id: id, item_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardChecklistItems.removeChecklistItem(
        args.card_id,
        args.checklist_id,
        args.item_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardChecklistItems.updateChecklistItem',
    'Update checklist item (cardChecklistItems); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      checklist_id: id,
      item_id: id,
      body: z
        .strictObject({
          text: z.string().nullable().optional(),
          sort_order: z.number().optional(),
          checklist_id: id.optional(),
          checked: z.boolean().optional(),
          due_date: z.string().nullable().optional(),
          responsible_id: id.nullable().optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardChecklistItems.updateChecklistItem(
        args.card_id,
        args.checklist_id,
        args.item_id,
        args.body as Parameters<
          typeof client.cardChecklistItems.updateChecklistItem
        >[3],
        options,
      ),
    }),
  );
  registry.add(
    'cardChecklists.addChecklistToCard',
    'Add checklist to card (cardChecklists); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      body: z
        .strictObject({
          name: z.string().optional(),
          sort_order: z.number().optional(),
          items_source_checklist_id: id.optional(),
          exclude_item_ids: z.array(id).optional(),
          source_share_id: id.optional(),
        })
        .refine(
          value =>
            value['name'] !== undefined ||
            value['source_share_id'] !== undefined,
          'Supply at least one of: name, source_share_id.',
        ),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardChecklists.addChecklistToCard(
        args.card_id,
        args.body as Parameters<
          typeof client.cardChecklists.addChecklistToCard
        >[1],
        options,
      ),
    }),
  );
  registry.add(
    'cardChecklists.removeChecklistFromCard',
    'Remove checklist from card (cardChecklists); full API fields and JSON response.',
    z.strictObject({card_id: id, checklist_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardChecklists.removeChecklistFromCard(
        args.card_id,
        args.checklist_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardChecklists.retrieveCardChecklist',
    'Retrieve card checklist (cardChecklists); full API fields and JSON response.',
    z.strictObject({card_id: id, checklist_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cardChecklists.retrieveCardChecklist(
        args.card_id,
        args.checklist_id,
        options,
      ),
    }),
  );
  registry.add(
    'cardChecklists.updateChecklist',
    'Update checklist (cardChecklists); full API fields and JSON response.',
    z.strictObject({
      card_id: id,
      checklist_id: id,
      body: z
        .strictObject({
          name: z.string().optional(),
          sort_order: z.number().optional(),
          card_id: id.optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardChecklists.updateChecklist(
        args.card_id,
        args.checklist_id,
        args.body as Parameters<
          typeof client.cardChecklists.updateChecklist
        >[2],
        options,
      ),
    }),
  );
  registry.add(
    'checklistItems.addItemToChecklist',
    'Add item to checklist (checklistItems); full API fields and JSON response.',
    z.strictObject({
      checklist_id: id,
      body: z.strictObject({
        text: z.string(),
        sort_order: z.number().optional(),
        checked: z.boolean().optional(),
        due_date: z.string().nullable().optional(),
        responsible_id: id.optional(),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.checklistItems.addItemToChecklist(
        args.checklist_id,
        args.body as Parameters<
          typeof client.checklistItems.addItemToChecklist
        >[1],
        options,
      ),
    }),
  );
  registry.add(
    'checklistItems.removeChecklistItem',
    'Remove checklist item (checklistItems); full API fields and JSON response.',
    z.strictObject({checklist_id: id, item_id: id}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.checklistItems.removeChecklistItem(
        args.checklist_id,
        args.item_id,
        options,
      ),
    }),
  );
  registry.add(
    'checklistItems.updateChecklistItem',
    'Update checklist item (checklistItems); full API fields and JSON response.',
    z.strictObject({
      checklist_id: id,
      item_id: id,
      body: z
        .strictObject({
          text: z.string().nullable().optional(),
          sort_order: z.number().optional(),
          checklist_id: id.optional(),
          checked: z.boolean().optional(),
          due_date: z.string().nullable().optional(),
          responsible_id: id.nullable().optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.checklistItems.updateChecklistItem(
        args.checklist_id,
        args.item_id,
        args.body as Parameters<
          typeof client.checklistItems.updateChecklistItem
        >[2],
        options,
      ),
    }),
  );
  registry.add(
    'checklists.retrieveCardsWithChecklist',
    'Retrieve cards with checklist (checklists); full API fields and JSON response.',
    z.strictObject({id: id, only_shared_cards: z.boolean()}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.checklists.retrieveCardsWithChecklist(
        args.id,
        args.only_shared_cards,
        options,
      ),
    }),
  );
  registry.add(
    'spaceTemplateChecklist.createNewSpaceTemplateChecklist',
    'Create new space template checklist (spaceTemplateChecklist); full API fields and JSON response.',
    z.strictObject({
      space_uid: text,
      name: z.string(),
      sort_order: z.number().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result:
        await client.spaceTemplateChecklist.createNewSpaceTemplateChecklist(
          args.space_uid,
          args.name,
          args.sort_order,
          options,
        ),
    }),
  );
  registry.add(
    'spaceTemplateChecklist.getListOfSpaceTemplateChecklists',
    'Get list of space template checklists (spaceTemplateChecklist); full API fields and JSON response.',
    z.strictObject({space_uid: text}),
    apiResult,
    read,
    async (args, options) => ({
      result:
        await client.spaceTemplateChecklist.getListOfSpaceTemplateChecklists(
          args.space_uid,
          options,
        ),
    }),
  );
  registry.add(
    'spaceTemplateChecklist.removeSpaceTemplateChecklist',
    'Remove space template checklist (spaceTemplateChecklist); full API fields and JSON response.',
    z.strictObject({space_uid: text, template_checklist_uid: text}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.spaceTemplateChecklist.removeSpaceTemplateChecklist(
        args.space_uid,
        args.template_checklist_uid,
        options,
      ),
    }),
  );
  registry.add(
    'spaceTemplateChecklist.updateSpaceTemplateChecklist',
    'Update space template checklist (spaceTemplateChecklist); full API fields and JSON response.',
    z.strictObject({
      space_uid: text,
      template_checklist_uid: text,
      body: z
        .strictObject({
          name: z.string().optional(),
          sort_order: z.number().optional(),
          space_uid: text.optional(),
        })
        .refine(
          value =>
            value['sort_order'] !== undefined || value['name'] !== undefined,
          'Supply at least one of: sort_order, name.',
        ),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.spaceTemplateChecklist.updateSpaceTemplateChecklist(
        args.space_uid,
        args.template_checklist_uid,
        args.body as Parameters<
          typeof client.spaceTemplateChecklist.updateSpaceTemplateChecklist
        >[2],
        options,
      ),
    }),
  );
  registry.add(
    'spaceTemplateChecklistItems.createNewSpaceTemplateChecklistItem',
    'Create new space template checklist item (spaceTemplateChecklistItems); full API fields and JSON response.',
    z.strictObject({
      space_uid: text,
      template_checklist_uid: text,
      text: z.string(),
      sort_order: z.number().optional(),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result:
        await client.spaceTemplateChecklistItems.createNewSpaceTemplateChecklistItem(
          args.space_uid,
          args.template_checklist_uid,
          args.text,
          args.sort_order,
          options,
        ),
    }),
  );
  registry.add(
    'spaceTemplateChecklistItems.removeSpaceTemplateChecklistItem',
    'Remove space template checklist item (spaceTemplateChecklistItems); full API fields and JSON response.',
    z.strictObject({
      space_uid: text,
      template_checklist_uid: text,
      item_uid: text,
    }),
    apiResult,
    change,
    async (args, options) => ({
      result:
        await client.spaceTemplateChecklistItems.removeSpaceTemplateChecklistItem(
          args.space_uid,
          args.template_checklist_uid,
          args.item_uid,
          options,
        ),
    }),
  );
  registry.add(
    'spaceTemplateChecklistItems.updateSpaceTemplateChecklistItem',
    'Update space template checklist item (spaceTemplateChecklistItems); full API fields and JSON response.',
    z.strictObject({
      space_uid: text,
      template_checklist_uid: text,
      item_uid: text,
      body: z
        .strictObject({
          text: z.string().optional(),
          sort_order: z.number().optional(),
        })
        .refine(hasChanges, 'Supply at least one change.'),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result:
        await client.spaceTemplateChecklistItems.updateSpaceTemplateChecklistItem(
          args.space_uid,
          args.template_checklist_uid,
          args.item_uid,
          args.body as Parameters<
            typeof client.spaceTemplateChecklistItems.updateSpaceTemplateChecklistItem
          >[3],
          options,
        ),
    }),
  );
}
