import {KaitenClient} from '@2chevskii/kaiten-client';
import {KaitenScimClient} from '@2chevskii/kaiten-client/scim';
import {McpServer} from '@modelcontextprotocol/server';
import packageJson from '../package.json' with {type: 'json'};
import type {Configuration} from './config.ts';
import {modelInstructions} from './model-context.ts';
import {ToolRegistry} from './tool-registry.ts';
import {registerNavigation} from './tools/navigation.ts';
import {registerCardRead} from './tools/card-read.ts';
import {registerCardWrite} from './tools/card-write.ts';
import {registerComments} from './tools/comments.ts';
import {registerCardExternalLinks} from './tools/card-external-links.ts';
import {registerCardRelations} from './tools/card-relations.ts';
import {registerCardChildren} from './tools/card-children.ts';
import {registerChecklists} from './tools/checklists.ts';
import {registerCustomProperties} from './tools/custom-properties.ts';
import {registerWorkspaceManagement} from './tools/workspace-management.ts';
import {registerAdvancedCardOperations} from './tools/advanced-card-operations.ts';
import {registerCardBlockersAndRelations} from './tools/card-blockers-and-relations.ts';
import {registerIdentityAndAccess} from './tools/identity-and-access.ts';
import {registerScimProvisioning} from './tools/scim-provisioning.ts';
import {registerCardTypesAndTags} from './tools/card-types-and-tags.ts';
import {registerCustomFieldAdministration} from './tools/custom-field-administration.ts';

export function createServer(
  configuration: Configuration,
  shutdownSignal: AbortSignal,
) {
  const client = new KaitenClient({
    origin: configuration.origin,
    token: configuration.token,
  });
  const instructions = modelInstructions(configuration.context);
  const server = new McpServer(
    {name: 'kaiten-mcp', version: packageJson.version},
    {instructions},
  );
  const registry = new ToolRegistry(
    server,
    client,
    configuration.timeoutMs,
    shutdownSignal,
    instructions,
  );
  registry.group('navigation');
  registerNavigation(registry);
  registry.group('cards');
  registerCardRead(registry);
  registry.group('cards');
  registerCardWrite(registry);
  registry.group('comments');
  registerComments(registry);
  registry.group('external_links');
  registerCardExternalLinks(registry);
  registry.group('relations');
  registerCardRelations(registry);
  registry.group('children');
  registerCardChildren(registry);
  registry.group('checklists');
  registerChecklists(registry);
  registry.group('custom_properties');
  registerCustomProperties(registry);
  registry.group('navigation');
  registerWorkspaceManagement(registry);
  registry.group('cards');
  registerAdvancedCardOperations(registry);
  registerCardBlockersAndRelations(registry);
  registry.group('navigation');
  registerIdentityAndAccess(registry);
  registerScimProvisioning(
    registry,
    new KaitenScimClient({
      origin: configuration.origin,
      token: configuration.token,
    }),
  );
  registerCardTypesAndTags(registry);
  registry.group('custom_properties');
  registerCustomFieldAdministration(registry);
  registry.register();
  return {server};
}
