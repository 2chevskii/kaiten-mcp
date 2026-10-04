import * as z from 'zod/v4';
import {defined, id, pageFields, properties} from '../schemas.ts';
import {entityResult, offsetPage, pageResult} from '../results.ts';
import {change, read, type ToolRegistry} from '../tool-registry.ts';
import {
  cardDetails,
  directoryRecordView,
  directoryView,
  propertyOptionView,
  propertyView,
} from '../views.ts';

export function registerCustomProperties(registry: ToolRegistry): void {
  const {client} = registry;
  const searchPage = z.strictObject({
    ...pageFields,
    query: z.string().optional(),
  });
  const optionsPage = z.strictObject({
    property_id: id,
    ...pageFields,
    query: z.string().optional(),
  });
  registry.add(
    'list_custom_properties',
    'Find existing custom property definitions. Inspect type, multi_select and data before assigning values.',
    searchPage,
    pageResult(propertyView),
    read,
    async (args, options) =>
      offsetPage(
        await client.customProperties.getListOfProperties(
          defined(args),
          options,
        ),
        args,
      ),
  );
  registry.add(
    'get_custom_property',
    'Read a custom property definition and type-specific settings.',
    z.strictObject({property_id: id}),
    entityResult(propertyView),
    read,
    async (args, options) => ({
      item: await client.customProperties.getProperty(
        args.property_id,
        options,
      ),
    }),
  );
  registry.add(
    'list_select_values',
    'Find existing select options. Card values use an array of numeric option IDs, including single-select properties.',
    optionsPage,
    pageResult(propertyOptionView),
    read,
    async ({property_id, ...query}, options) =>
      offsetPage(
        await client.customPropertySelectValues.getListOfSelectValues(
          property_id,
          defined(query),
          options,
        ),
        query,
      ),
  );
  registry.add(
    'list_catalog_values',
    'Find existing catalog values. Assign a catalog value ID as a string in card properties.',
    optionsPage,
    pageResult(propertyOptionView),
    read,
    async ({property_id, ...query}, options) =>
      offsetPage(
        await client.customPropertyCatalogValues.getListOfCatalogValues(
          property_id,
          defined(query),
          options,
        ),
        query,
      ),
  );
  registry.add(
    'list_custom_directories',
    'Find existing custom directories with field definitions.',
    searchPage,
    pageResult(directoryView),
    read,
    async (args, options) =>
      offsetPage(
        await client.customDirectories.getListOfCustomDirectories(
          {...defined(args), include_fields: true},
          options,
        ),
        args,
      ),
  );
  registry.add(
    'list_custom_directory_records',
    'Find records in an existing custom directory. Assign record UUIDs as an array in card properties.',
    z.strictObject({
      directory_id: z.uuid(),
      ...pageFields,
      query: z.string().optional(),
    }),
    pageResult(directoryRecordView),
    read,
    async ({directory_id, ...query}, options) =>
      offsetPage(
        await client.customDirectoryRecords.getListOfRecords(
          directory_id,
          {...defined(query), include_values: true},
          options,
        ),
        query,
      ),
  );
  registry.add(
    'set_card_properties',
    'Set existing card properties using id_<propertyId> keys. Omitted properties remain unchanged; null clears a value. Use native Kaiten formats: scalar text/number, select ID arrays, catalog string ID, directory UUID arrays, or a date object with date/time/tzOffset. Definitions and options are read-only.',
    z.strictObject({
      card_id: id,
      properties: properties.refine(
        value => Object.keys(value).length > 0,
        'Supply at least one property.',
      ),
    }),
    entityResult(cardDetails),
    change,
    async (args, options) => ({
      item: await client.cards.updateCard(
        args.card_id,
        {properties: args.properties},
        options,
      ),
    }),
  );
}
