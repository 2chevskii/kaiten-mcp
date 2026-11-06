import * as z from 'zod/v4';
import {id, text} from '../schemas.ts';
import {read, change, type ToolRegistry} from '../tool-registry.ts';
import {apiResult} from '../results.ts';

export function registerServiceDesk(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'cardServiceDeskExternalRecipients.addNewRecipient',
    'Add new recipient (cardServiceDeskExternalRecipients); full API fields and JSON response.',
    z.strictObject({card_id: id, email: text}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardServiceDeskExternalRecipients.addNewRecipient(
        args.card_id,
        args.email,
        options,
      ),
    }),
  );
  registry.add(
    'cardServiceDeskExternalRecipients.removeRecipient',
    'Remove recipient (cardServiceDeskExternalRecipients); full API fields and JSON response.',
    z.strictObject({card_id: id, email: text}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.cardServiceDeskExternalRecipients.removeRecipient(
        args.card_id,
        args.email,
        options,
      ),
    }),
  );
  registry.add(
    'cardSla.retrieveCardSlaMeasurements',
    'Retrieve card SLA rule measurements and calendars; preserve the full client JSON.',
    z.strictObject({card_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.cardSla.retrieveCardSlaMeasurements(
        args.card_id,
        options,
      ),
    }),
  );
  registry.add(
    'serviceDeskServices.retrieveServicesList',
    'Retrieve services list (serviceDeskServices); full API fields and JSON response.',
    z.strictObject({}),
    apiResult,
    read,
    async (_args, options) => ({
      result: await client.serviceDeskServices.retrieveServicesList(options),
    }),
  );
}
