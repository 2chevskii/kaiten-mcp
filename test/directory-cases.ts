import {directoryId, type ToolCase} from './tool-cases.ts';

export const fieldId = '22345678-1234-4234-8234-123456789abc';
export const recordId = '32345678-1234-4234-8234-123456789abc';
const directory = {
  id: directoryId,
  name: 'Contacts',
  settings: {allow_editing: true},
  fields: [],
};
const field = {id: fieldId, name: 'Name', type: 'string', required: false};
const record = {
  id: recordId,
  display_value: 'Alice',
  values: [{field_id: fieldId, value: 'Alice'}],
};
const root = `/company/custom-directories/${directoryId}`;

export const directoryCases: ToolCase[] = [
  {
    name: 'customDirectories.createCustomDirectory',
    args: {
      body: {
        name: 'Contacts',
        description: null,
        allow_editing: false,
        multi_select: false,
        display_field_index: 0,
        fields: [
          {
            name: 'Name',
            type: 'string',
            required: false,
            linked_directory_id: null,
          },
        ],
      },
    },
    method: 'POST',
    path: '/company/custom-directories',
    body: {
      name: 'Contacts',
      description: null,
      allow_editing: false,
      multi_select: false,
      display_field_index: 0,
      fields: [
        {
          name: 'Name',
          type: 'string',
          required: false,
          linked_directory_id: null,
        },
      ],
    },
    response: directory,
  },
  {
    name: 'customDirectories.getListOfCustomDirectories',
    args: {
      query: {
        include_fields: true,
        include_author: false,
        include_records_count: true,
        conditions: ['active', 'inactive'],
        query: 'Contacts',
        limit: 2,
        offset: 0,
      },
    },
    method: 'GET',
    path: '/company/custom-directories',
    query: {
      include_fields: 'true',
      include_author: 'false',
      include_records_count: 'true',
      conditions: 'active,inactive',
      query: 'Contacts',
      limit: '2',
      offset: '0',
    },
    response: [directory],
  },
  {
    name: 'customDirectories.getCustomDirectory',
    args: {directory_id: directoryId},
    method: 'GET',
    path: root,
    response: directory,
  },
  {
    name: 'customDirectories.updateCustomDirectory',
    args: {
      directory_id: directoryId,
      body: {
        expected_field_ids: [fieldId],
        description: null,
        allow_editing: false,
        fields: [
          {
            id: fieldId,
            name: 'New',
            type: 'string',
            is_display: true,
            required: false,
          },
        ],
      },
    },
    method: 'PATCH',
    path: root,
    body: {
      expected_field_ids: [fieldId],
      description: null,
      allow_editing: false,
      fields: [
        {
          id: fieldId,
          name: 'New',
          type: 'string',
          is_display: true,
          required: false,
        },
      ],
    },
    response: directory,
  },
  {
    name: 'customDirectories.deleteCustomDirectory',
    args: {directory_id: directoryId},
    method: 'DELETE',
    path: root,
    response: {...directory, condition: 'removed'},
  },
  {
    name: 'customDirectoryFields.createField',
    args: {
      directory_id: directoryId,
      body: {
        name: 'Name',
        type: 'string',
        required: false,
        is_display: true,
        sort_order: 0,
      },
    },
    method: 'POST',
    path: `${root}/fields`,
    body: {
      name: 'Name',
      type: 'string',
      required: false,
      is_display: true,
      sort_order: 0,
    },
    response: field,
  },
  {
    name: 'customDirectoryFields.getListOfFields',
    args: {
      directory_id: directoryId,
      include_author: false,
      conditions: ['active', 'removed'],
    },
    method: 'GET',
    path: `${root}/fields`,
    query: {include_author: 'false', conditions: 'active,removed'},
    response: [field],
  },
  {
    name: 'customDirectoryFields.getField',
    args: {directory_id: directoryId, field_id: fieldId},
    method: 'GET',
    path: `${root}/fields/${fieldId}`,
    response: field,
  },
  {
    name: 'customDirectoryFields.updateField',
    args: {
      directory_id: directoryId,
      field_id: fieldId,
      body: {
        name: 'New',
        required: false,
        is_display: false,
        sort_order: 0,
        condition: 'inactive',
      },
    },
    method: 'PATCH',
    path: `${root}/fields/${fieldId}`,
    body: {
      name: 'New',
      required: false,
      is_display: false,
      sort_order: 0,
      condition: 'inactive',
    },
    response: field,
  },
  {
    name: 'customDirectoryFields.deleteField',
    args: {directory_id: directoryId, field_id: fieldId},
    method: 'DELETE',
    path: `${root}/fields/${fieldId}`,
    response: {...field, condition: 'removed'},
  },
  {
    name: 'customDirectoryRecords.createRecord',
    args: {
      directory_id: directoryId,
      response_profile: 'full',
      body: {values: {[fieldId]: 'Alice'}},
    },
    method: 'POST',
    path: `${root}/records`,
    query: {response_profile: 'full'},
    body: {values: {[fieldId]: 'Alice'}},
    response: record,
  },
  {
    name: 'customDirectoryRecords.getListOfRecords',
    args: {
      directory_id: directoryId,
      query: {
        include_values: true,
        include_author: false,
        profile: 'full',
        conditions: ['active'],
        filters: [
          {
            fieldId,
            fieldType: 'string',
            comparison: 'contains',
            value: 'Русский',
          },
        ],
        filter_operator: 'and',
        limit: 2,
        offset: 0,
      },
    },
    method: 'GET',
    path: `${root}/records`,
    query: {
      include_values: 'true',
      include_author: 'false',
      profile: 'full',
      conditions: 'active',
      filter_operator: 'and',
      limit: '2',
      offset: '0',
      'filters[0][fieldId]': fieldId,
      'filters[0][fieldType]': 'string',
      'filters[0][comparison]': 'contains',
      'filters[0][value]': 'Русский',
    },
    response: [record],
  },
  {
    name: 'customDirectoryRecords.getRecord',
    args: {directory_id: directoryId, record_id: recordId, profile: 'compact'},
    method: 'GET',
    path: `${root}/records/${recordId}`,
    query: {profile: 'compact'},
    response: record,
  },
  {
    name: 'customDirectoryRecords.updateRecord',
    args: {
      directory_id: directoryId,
      record_id: recordId,
      response_profile: 'full',
      body: {condition: 'inactive', values: {[fieldId]: null}},
    },
    method: 'PATCH',
    path: `${root}/records/${recordId}`,
    query: {response_profile: 'full'},
    body: {condition: 'inactive', values: {[fieldId]: null}},
    response: record,
  },
  {
    name: 'customDirectoryRecords.getCardsLinkedToRecord',
    args: {
      directory_id: directoryId,
      record_id: recordId,
      query: {filter: 'all', limit: 2, offset: 0},
    },
    method: 'GET',
    path: `${root}/records/${recordId}/cards`,
    query: {filter: 'all', limit: '2', offset: '0'},
    response: [{id: 10, title: 'Linked card'}],
  },
  {
    name: 'customDirectoryRecords.deleteRecord',
    args: {directory_id: directoryId, record_id: recordId},
    method: 'DELETE',
    path: `${root}/records/${recordId}`,
    response: {...record, condition: 'removed'},
  },
];
