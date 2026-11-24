import type {CatalogDefinition} from '../catalog.ts';
import {directoryReads, directoryWrites} from './data/directories.ts';
import {fieldReads, fieldWrites} from './data/fields.ts';

export const customPropertiesCatalog: CatalogDefinition = {
  custom_properties_read: {
    description: [
      'Discover Kaiten custom field definitions, allowed values and directory records. Use kaiten_cards_read for values already stored on a card.',
      '- Check type, multi_select and data with get_custom_property before choosing select options, catalog entries or directory records. Use list_property_bindings for definition availability, list_collective_scores or list_collective_votes for contributions on a card, and list_cards_linked_to_record for cards visible to the token that reference a record.',
      '- Compact lists default to 25 items, cap at 100 and return next_offset. Set format to native for advanced filters. In a directory record query, take a field UUID and type from list_directory_fields, then pass query.filters as an array of objects with fieldId, fieldType and a compatible comparison. For example, match a string field with contains and a text value.',
      '- Kaiten enforces token access. Check permissions on HTTP 403 or resolve the field or directory ID again on 404. Use kaiten_custom_properties_write for assignments and administration.',
    ].join('\n'),
    operations: {...fieldReads, ...directoryReads},
  },
  custom_properties_write: {
    description: [
      'Set Kaiten custom field values or administer their definitions. Select request.operation for a card value, definition, option, contribution or directory record. Use kaiten_cards_write for card creation, content and lifecycle.',
      '- Read the definition and options with kaiten_custom_properties_read. For set_card_properties, use id_<propertyId> keys and numeric option arrays even for single-select fields. Omit keys to keep them and use null to clear them. Directory record body.values uses field UUID keys.',
      '- Submit scores as strings and add votes in the numeric or emoji form defined for the field. For updates, pass a score record’s id as value_id or a numeric vote record’s id as id. Find them with list_collective_scores and list_collective_votes. Add and update return contribution records. Read back the record after a timeout before resubmitting.',
      '- Definition and directory schema writes require custom-property management rights. Record writes can also use the directory’s allow_editing setting. When replacing a directory’s field list, include every field to keep and expected_field_ids from the current active and inactive fields. Reload on 409. Omissions soft-delete fields. Check bindings and linked cards before deleting shared data.',
    ].join('\n'),
    operations: {...fieldWrites, ...directoryWrites},
  },
};
