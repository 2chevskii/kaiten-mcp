import * as z from 'zod/v4';
import {defined, id, pageFields, pageInput} from '../schemas.ts';
import {entityResult, offsetPage, pageResult} from '../results.ts';
import {read, type ToolRegistry} from '../tool-registry.ts';
import {
  boardView,
  locationView,
  namedView,
  spaceView,
  tagView,
  userView,
} from '../views.ts';

export function registerNavigation(registry: ToolRegistry): void {
  const {client} = registry;
  registry.add(
    'list_spaces',
    'List accessible Kaiten spaces. Use their IDs to discover boards.',
    pageInput,
    pageResult(namedView),
    read,
    async (args, options) =>
      offsetPage(
        await client.spaces.retrieveListOfSpaces(
          args.limit,
          args.offset,
          options,
        ),
        args,
      ),
  );
  registry.add(
    'get_space',
    'Get a space and its available board references.',
    z.strictObject({space_id: id}),
    entityResult(spaceView),
    read,
    async (args, options) => ({
      item: await client.spaces.retrieveSpace(args.space_id, options),
    }),
  );
  registry.add(
    'list_boards',
    'List boards in a space. Pagination is applied locally.',
    z.strictObject({space_id: id, ...pageFields}),
    pageResult(namedView),
    read,
    async (args, options) =>
      offsetPage(
        await client.spaceBoards.getListOfBoards(args.space_id, options),
        args,
        true,
      ),
  );
  registry.add(
    'get_board',
    'Get board details, columns, lanes and custom property configuration.',
    z.strictObject({board_id: id}),
    entityResult(boardView),
    read,
    async (args, options) => ({
      item: await client.boards.getBoard(args.board_id, options),
    }),
  );
  registry.add(
    'list_columns',
    'List columns on a board in Kaiten order. Pagination is applied locally.',
    z.strictObject({board_id: id, ...pageFields}),
    pageResult(locationView),
    read,
    async (args, options) =>
      offsetPage(
        await client.columns.getListOfColumns(args.board_id, options),
        args,
        true,
      ),
  );
  registry.add(
    'list_lanes',
    'List lanes on a board. Pagination is applied locally.',
    z.strictObject({board_id: id, ...pageFields}),
    pageResult(locationView),
    read,
    async (args, options) =>
      offsetPage(
        await client.lanes.getListOfLanes(args.board_id, undefined, options),
        args,
        true,
      ),
  );
  registry.add(
    'get_current_user',
    'Identify the user associated with the configured Kaiten token.',
    z.strictObject({}),
    entityResult(userView),
    read,
    async (_args, options) => ({
      item: await client.users.retrieveCurrentUser(options),
    }),
  );
  registry.add(
    'list_users',
    'Find company users by query to obtain user IDs for ownership and membership.',
    z.strictObject({...pageFields, query: z.string().optional()}),
    pageResult(userView),
    read,
    async (args, options) =>
      offsetPage(
        await client.companyUsers.getListOfUsers(defined(args), options),
        args,
      ),
  );
  registry.add(
    'list_card_types',
    'List existing card types.',
    pageInput,
    pageResult(namedView),
    read,
    async (args, options) =>
      offsetPage(
        await client.cardTypes.getListOfCardTypes(
          args.limit,
          args.offset,
          options,
        ),
        args,
      ),
  );
  registry.add(
    'list_tags',
    'Find tags by name, optionally within a space.',
    z.strictObject({
      ...pageFields,
      query: z.string().optional(),
      space_id: id.optional(),
    }),
    pageResult(tagView),
    read,
    async (args, options) =>
      offsetPage(
        await client.tags.retrieveListOfTags(defined(args), options),
        args,
      ),
  );
}
