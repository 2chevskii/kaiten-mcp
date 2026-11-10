import {KaitenClient} from '@2chevskii/kaiten-client';
import {KaitenScimClient} from '@2chevskii/kaiten-client/scim';
import {AddonOAuthClient} from '@2chevskii/kaiten-client/addon-oauth';
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
import {registerCustomDirectoryAdministration} from './tools/custom-directory-administration.ts';
import {registerChecklistTemplates} from './tools/checklist-templates.ts';
import {registerTimeTracking} from './tools/time-tracking.ts';
import {registerIterationsAndSprints} from './tools/iterations-and-sprints.ts';
import {registerServiceDesk} from './tools/service-desk.ts';
import {registerDocumentsAndGroups} from './tools/documents-and-groups.ts';
import {registerAutomations} from './tools/automations.ts';
import {registerActivityAndAudit} from './tools/activity-and-audit.ts';
import {registerIncomingCardWebhooks} from './tools/incoming-card-webhooks.ts';
import {registerAddonOAuth} from './tools/addon-oauth.ts';
import {registerFiles} from './tools/files.ts';
import {registerAdvancedComments} from './tools/advanced-comments.ts';
import {defaultMaxFileBytes} from './file-transfer.ts';

export function createServer(
  configuration: Configuration,
  shutdownSignal: AbortSignal,
) {
  const client = new KaitenClient({
    origin: configuration.origin,
    token: configuration.token,
    ...(configuration.apiVersion === undefined
      ? {}
      : {apiVersion: configuration.apiVersion}),
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
  registerCustomDirectoryAdministration(registry);
  registry.group('checklists');
  registerChecklistTemplates(registry);
  registry.group('cards');
  registerTimeTracking(registry);
  registry.group('navigation');
  registerIterationsAndSprints(registry);
  registry.group('cards');
  registerServiceDesk(registry);
  registry.group('documents');
  registerDocumentsAndGroups(registry);
  registry.group('navigation');
  registerAutomations(registry);
  registerActivityAndAudit(registry);
  registry.group('cards');
  registerIncomingCardWebhooks(registry);
  registry.group('navigation');
  registerAddonOAuth(
    registry,
    configuration.addonSecret === undefined
      ? undefined
      : new AddonOAuthClient({
          origin: configuration.origin,
          addonSecret: configuration.addonSecret,
        }),
  );
  const maximum = configuration.maxFileBytes ?? defaultMaxFileBytes;
  registry.group('comments');
  registerAdvancedComments(registry, maximum);
  registry.group('files');
  registerFiles(registry, maximum, configuration.origin);
  registry.register();
  return {server};
}
