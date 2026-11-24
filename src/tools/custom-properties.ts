import * as z from 'zod/v4';
import {defined, id, pageFields, properties, uuid} from '../schemas.ts';
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
    z.strictObject({
      directory_id: uuid,
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
