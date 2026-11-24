import type {CatalogDefinition} from '../catalog.ts';

export const workspaceCatalog: CatalogDefinition = {
  workspace_read: {
    description:
      'Identify the Kaiten token account and look up spaces and boards. Resolve the token account before searching for personal tasks. Use space references to validate workspace scope, then read a board for its configuration.',
    operations: {
      get_current_user: {
        source: 'get_current_user',
        description: 'Identify the account associated with the server token.',
      },
      get_space: {
        source: 'get_space',
        description: 'Look up a space and its board references by numeric ID.',
        fields: {space_id: 'Space ID returned by Kaiten.'},
      },
      get_board: {
        source: 'get_board',
        description: 'Read a board, including its columns and lanes.',
        fields: {board_id: 'Board ID from a space or board reference.'},
      },
      list_boards: {
        source: 'list_boards',
        description:
          'Read a page of boards in a space. Paging slices the returned board list locally.',
        fields: {
          space_id: 'Space ID whose boards should be listed.',
          limit: 'Maximum boards in this result page.',
          offset:
            'Start position. Use the previous next_offset for another page.',
        },
      },
    },
  },
};
