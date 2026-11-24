import type {CatalogDefinition} from '../catalog.ts';
import {directoryReads, directoryWrites} from './data/directories.ts';
import {fieldReads, fieldWrites} from './data/fields.ts';

export const customPropertiesCatalog: CatalogDefinition = {
  custom_properties_read: {
    description:
      'Discover Kaiten custom field definitions, permitted values, and directory records. Read the definition’s type, multi_select, and data before choosing select options, catalog entries, or directory records. Directories own field definitions and records. Read directory fields to resolve field UUIDs before filtering records. Compact lists default to 25 results (up to 100) and return next_offset. Native argument forms expose advanced filters, ordering, and metadata. Use kaiten_custom_properties_write to assign a resolved value or administer the definition.',
    operations: {...fieldReads, ...directoryReads},
  },
  custom_properties_write: {
    description:
      'Set card custom values and administer reusable field definitions, options, votes, and directory data. Use kaiten_custom_properties_read to resolve the definition and permitted values. set_card_properties uses id_<propertyId> keys, preserves omitted values and clears explicit nulls. Directory records instead use field UUID keys. Definition and directory schema changes require Kaiten custom-property management rights. Updating a directory with fields replaces the complete list and soft-deletes omissions. Read dependencies before deleting a definition, option or record shared across cards.',
    operations: {...fieldWrites, ...directoryWrites},
  },
};
