import type {CatalogRoute} from '../../catalog.ts';
import {compactPage, nativePage} from './fields.ts';
import {nativeResult} from './native-result.ts';

const directoryId = 'Directory UUID from list_custom_directories.';
const fieldId = 'Field UUID from list_directory_fields in this directory.';
const recordId =
  'Record UUID from list_custom_directory_records in this directory.';
const byDirectory = {directory_id: directoryId};
const byField = {...byDirectory, field_id: fieldId};
const byRecord = {...byDirectory, record_id: recordId};
const conditions =
  'Lifecycle filter array with active, inactive or removed entries.';
const condition =
  'Lifecycle state of this entry. Use inactive to disable it, or removed to mark it removed.';
const profile =
  'Response detail level: none omits values, summary includes direct values, details expands linked records, and full includes the next link level. A recognized profile overrides include_values.';
const fieldFlags = {
  'body.required': 'Whether records must provide a value for this field.',
  'body.is_display': 'Use this field as the record display value.',
  'body.sort_order': 'Position among the directory’s fields.',
};
const directoryFields = {
  'body.description': 'Directory description. Null clears it.',
  'body.multi_select':
    'Permit multiple records to be selected where this directory is used.',
  'body.allow_editing':
    'Allow record edits without custom-property management rights, subject to Kaiten access checks.',
  'body.fields.type':
    'Value kind of the directory field. This determines supported inputs and filter comparisons.',
  'body.fields.custom_property_uid':
    'UID of the backing custom property for a field that uses one.',
  'body.fields.linked_directory_id':
    'Target directory UUID for a directory_link field.',
};
const recordFields = {
  ...byDirectory,
  'body.values':
    'Map of field UUIDs to native field values. Read field definitions before choosing values.',
  response_profile:
    'Response profile controlling how record values and linked relations expand.',
};

export const directoryReads = {
  list_custom_directories: [
    {
      source: 'list_custom_directories',
      description:
        'Discover directories by name, including their field definitions.',
      fields: {...compactPage, query: 'Text to match against directory names.'},
    },
    nativeResult({
      source: 'customDirectories.getListOfCustomDirectories',
      description:
        'Read one native directory page with lifecycle conditions and optional field, author or record count metadata.',
      fields: {
        ...nativePage,
        'query.query': 'Text to match against directory names.',
        'query.conditions': conditions,
        'query.include_fields': 'Include field definitions in each directory.',
        'query.include_author': 'Include the directory author.',
        'query.include_records_count':
          'Include the number of records in each directory.',
      },
    }),
  ],
  get_custom_directory: {
    source: 'customDirectories.getCustomDirectory',
    description:
      'Inspect the directory’s settings and current metadata before editing its structure.',
    fields: byDirectory,
  },
  list_directory_fields: {
    source: 'customDirectoryFields.getListOfFields',
    description:
      'Get field UUIDs and types for the directory, including fields used as record labels. This endpoint returns the complete matching field list.',
    fields: {
      ...byDirectory,
      conditions,
      include_author: 'Include field authors.',
    },
  },
  get_directory_field: {
    source: 'customDirectoryFields.getField',
    description:
      'Inspect a single known directory field, including its type and flags.',
    fields: byField,
  },
  list_custom_directory_records: [
    {
      source: 'list_custom_directory_records',
      description:
        'Find records by displayed text in a known directory, including their values. Use record UUIDs in card directory properties.',
      fields: {
        ...byDirectory,
        ...compactPage,
        query: 'Text search to match a directory record.',
      },
    },
    nativeResult({
      source: 'customDirectoryRecords.getListOfRecords',
      description:
        'Filter a directory’s records by typed field comparisons, status or text and tune the linked-record response detail. Offset paging can skip or repeat entries during concurrent changes.',
      fields: {
        ...byDirectory,
        ...nativePage,
        'query.query': 'Text search to match a directory record.',
        'query.profile': profile,
        'query.include_values':
          'Expand record values when profile is omitted or unrecognized.',
        'query.include_author':
          'Include the record author independently of the profile.',
        'query.conditions': conditions,
        'query.filters':
          'Array or index-keyed object of typed field comparisons. Resolve each field UUID and type with list_directory_fields.',
        'query.filters.fieldId': 'UUID of the directory field being compared.',
        'query.filters.fieldType':
          'Actual field type. It controls which comparisons are valid.',
        'query.filters.comparison':
          'Choose a type-compatible operation, such as contains for text, gt for numbers or dates, true for checkboxes, or known for presence.',
        'query.filters.value':
          'Native value to compare. Required for comparisons other than presence and checkbox predicates.',
        'query.filters.searchByDisplayValue':
          'For select, user and catalog fields, use displayed values for the comparison. Enables contains.',
        'query.filter_operator': 'Combine filters with and (default) or or.',
      },
    }),
  ],
  get_directory_record: {
    source: 'customDirectoryRecords.getRecord',
    description:
      'Read one known directory record with an optional level of linked data. Use list_custom_directory_records to discover its UUID.',
    fields: {...byRecord, profile},
  },
  list_cards_linked_to_record: {
    source: 'customDirectoryRecords.getCardsLinkedToRecord',
    description:
      'Locate visible cards referencing a directory record before editing or deleting it. Kaiten filters results by the configured account’s card access.',
    fields: {
      ...byRecord,
      ...nativePage,
      'query.filter': 'Native filter string for the linked-card list.',
    },
  },
} satisfies Record<string, CatalogRoute | readonly CatalogRoute[]>;

export const directoryWrites = {
  create_custom_directory: {
    source: 'customDirectories.createCustomDirectory',
    description:
      'Create a reusable directory. Optionally define its fields and display field in the same request. Requires custom-property management permission.',
    fields: {
      ...directoryFields,
      'body.fields': 'Initial field definitions to create with this directory.',
      'body.display_field_index':
        'Zero-based index of the display field in the initial fields array.',
    },
  },
  update_custom_directory: {
    source: 'customDirectories.updateCustomDirectory',
    input: source =>
      source.safeExtend({
        body: source.shape.body!.meta({
          dependentRequired: {expected_field_ids: ['fields']},
        }),
      }),
    description:
      'Patch directory settings. To edit a single field, use update_directory_field. Supplying fields replaces the whole list and soft-deletes omitted fields.',
    fields: {
      ...byDirectory,
      ...directoryFields,
      'body.condition': condition,
      'body.fields':
        'Complete desired field list. Include every existing field to keep and its ID. Omitted fields are soft-deleted.',
      'body.fields.id':
        'Existing field UUID to retain or update. Omit for a new field.',
      'body.expected_field_ids':
        'Current field UUIDs from list_directory_fields as a guard for replacing the whole list. Send the replacement in body.fields. If Kaiten returns HTTP 409, reload the fields before building the replacement again.',
    },
  },
  delete_custom_directory: {
    source: 'customDirectories.deleteCustomDirectory',
    description:
      'Soft-delete the directory, all its fields and records. Kaiten rejects removal while active custom properties reference the directory.',
    fields: byDirectory,
  },
  create_directory_field: {
    source: 'customDirectoryFields.createField',
    description:
      'Add one field to an existing directory. Its type determines how records store and filter values.',
    fields: {
      ...byDirectory,
      ...fieldFlags,
      'body.type': 'Type of values the field can hold.',
    },
  },
  update_directory_field: {
    source: 'customDirectoryFields.updateField',
    description:
      'Patch the name, order, lifecycle or flags of one field. Changes affect how the directory displays and validates records.',
    fields: {...byField, ...fieldFlags, 'body.condition': condition},
  },
  delete_directory_field: {
    source: 'customDirectoryFields.deleteField',
    description:
      'Soft-delete one field from the directory. Check record dependencies and display settings first.',
    fields: byField,
  },
  create_directory_record: {
    source: 'customDirectoryRecords.createRecord',
    description:
      'Add a record to an existing directory. Requires custom-property management rights or allow_editing on the directory. Include required field values.',
    fields: recordFields,
  },
  update_directory_record: {
    source: 'customDirectoryRecords.updateRecord',
    description:
      'Patch a record’s values or lifecycle. Omitted value keys keep their values. Null clears supported values. The directory’s editing rights apply.',
    fields: {...recordFields, record_id: recordId, 'body.condition': condition},
  },
  delete_directory_record: {
    source: 'customDirectoryRecords.deleteRecord',
    description:
      'Soft-delete a record and remove its reverse directory links. Review linked cards first. The directory’s editing rights apply.',
    fields: byRecord,
  },
} satisfies Record<string, CatalogRoute>;
