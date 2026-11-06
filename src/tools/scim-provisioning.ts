import * as z from 'zod/v4';
import type {KaitenScimClient} from '@2chevskii/kaiten-client/scim';
import {id, text} from '../schemas.ts';
import {read, change, type ToolRegistry} from '../tool-registry.ts';
import {apiResult, collectItems} from '../results.ts';

const pageFields = {
  start_index: id.optional(),
  count: z.number().int().nonnegative().optional(),
};

export function registerScimProvisioning(
  registry: ToolRegistry,
  client: KaitenScimClient,
): void {
  registry.add(
    'scim.groups.iterate',
    'Collect a bounded snapshot through the public client iterator; returns items and truncated.',
    z.strictObject({
      ...pageFields,
      max_items: z.number().int().min(1).max(1_000).default(100),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await collectItems(
        client.groups.iterate(args.start_index, args.count, options),
        args.max_items,
      ),
    }),
  );
  registry.add(
    'scim.groups.addGroup',
    'Add group (groups); full API fields and JSON response.',
    z.strictObject({display_name: z.string()}),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.groups.addGroup(args.display_name, options),
    }),
  );
  registry.add(
    'scim.groups.getGroup',
    'Get group (groups); full API fields and JSON response.',
    z.strictObject({group_id: z.union([text, id])}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.groups.getGroup(args.group_id, options),
    }),
  );
  registry.add(
    'scim.groups.getGroups',
    'Get groups (groups); full API fields and JSON response.',
    z.strictObject({
      ...pageFields,
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.groups.getGroups(
        args.start_index,
        args.count,
        options,
      ),
    }),
  );
  registry.add(
    'scim.groups.updateGroup',
    'Update group (groups); full API fields and JSON response.',
    z.strictObject({
      group_id: z.union([text, id]),
      operations: z.array(
        z.union([
          z.strictObject({
            op: z.union([z.literal('add'), z.literal('remove')]),
            path: z.literal('members'),
            value: id,
          }),
          z.strictObject({
            op: z.union([z.literal('add'), z.literal('replace')]),
            path: z.literal('displayName'),
            value: z.string(),
          }),
        ]),
      ),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.groups.updateGroup(
        args.group_id,
        args.operations as Parameters<typeof client.groups.updateGroup>[1],
        options,
      ),
    }),
  );
  registry.add(
    'scim.users.iterate',
    'Collect a bounded snapshot through the public client iterator; returns items and truncated.',
    z.strictObject({
      ...pageFields,
      filter: z.string().optional(),
      max_items: z.number().int().min(1).max(1_000).default(100),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await collectItems(
        client.users.iterate(
          args.start_index,
          args.count,
          args.filter,
          options,
        ),
        args.max_items,
      ),
    }),
  );
  registry.add(
    'scim.users.addUser',
    'Add user (users); full API fields and JSON response.',
    z.strictObject({
      body: z.strictObject({
        userName: z.string().optional(),
        name: z
          .strictObject({
            givenName: z.string().optional(),
            familyName: z.string().optional(),
          })
          .optional(),
        emails: z.record(z.string(), z.json()),
      }),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.users.addUser(
        args.body as Parameters<typeof client.users.addUser>[0],
        options,
      ),
    }),
  );
  registry.add(
    'scim.users.getUser',
    'Get user (users); full API fields and JSON response.',
    z.strictObject({user_id: id}),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.users.getUser(args.user_id, options),
    }),
  );
  registry.add(
    'scim.users.getUsers',
    'Get users (users); full API fields and JSON response.',
    z.strictObject({
      ...pageFields,
      filter: z.string().optional(),
    }),
    apiResult,
    read,
    async (args, options) => ({
      result: await client.users.getUsers(
        args.start_index,
        args.count,
        args.filter,
        options,
      ),
    }),
  );
  registry.add(
    'scim.users.updateUser',
    'Update user (users); full API fields and JSON response.',
    z.strictObject({
      user_id: id,
      operations: z.array(
        z.union([
          z.strictObject({
            op: z.literal('replace'),
            path: z.literal('active'),
            value: z.boolean(),
          }),
          z.strictObject({
            op: z.union([z.literal('add'), z.literal('replace')]),
            path: z.literal('name'),
            value: z.strictObject({
              givenName: z.string().optional(),
              familyName: z.string().optional(),
            }),
          }),
          z.strictObject({
            op: z.union([z.literal('add'), z.literal('replace')]),
            path: z.union([
              z.literal('name.givenName'),
              z.literal('name.familyName'),
            ]),
            value: z.string(),
          }),
          z.strictObject({
            op: z.literal('remove'),
            path: z.union([
              z.literal('name'),
              z.literal('name.givenName'),
              z.literal('name.familyName'),
            ]),
          }),
        ]),
      ),
    }),
    apiResult,
    change,
    async (args, options) => ({
      result: await client.users.updateUser(
        args.user_id,
        args.operations as Parameters<typeof client.users.updateUser>[1],
        options,
      ),
    }),
  );
}
