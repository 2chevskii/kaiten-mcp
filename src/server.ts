import {KaitenClient} from '@2chevskii/kaiten-client';
import {KaitenScimClient} from '@2chevskii/kaiten-client/scim';
import {AddonOAuthClient} from '@2chevskii/kaiten-client/addon-oauth';
import {McpServer} from '@modelcontextprotocol/server';
import packageJson from '../package.json' with {type: 'json'};
import type {Configuration} from './config.ts';
import {modelInstructions} from './model-context.ts';
import {canonicalCatalog} from './catalog/index.ts';
import {ToolRegistry} from './tool-registry.ts';
import {registerNavigation} from './tools/navigation.ts';
import {registerCardRead} from './tools/card-read.ts';
import {registerCardWrite} from './tools/card-write.ts';
import {registerCardExternalLinks} from './tools/card-external-links.ts';
import {registerCardRelations} from './tools/card-relations.ts';
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
import {registerCanonicalPages} from './tools/canonical-pages.ts';

export function createToolRegistry(
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
  );
  registerNavigation(registry);
  registerCardRead(registry);
  registerCardWrite(registry);
  registerCardExternalLinks(registry);
  registerCardRelations(registry);
  registerChecklists(registry);
  registerCustomProperties(registry);
  registerWorkspaceManagement(registry);
  registerAdvancedCardOperations(registry);
  registerCardBlockersAndRelations(registry);
  registerIdentityAndAccess(registry);
  registerScimProvisioning(
    registry,
    new KaitenScimClient({
      origin: configuration.origin,
      token: configuration.token,
    }),
  );
  registerCardTypesAndTags(registry);
  registerCustomFieldAdministration(registry);
  registerCustomDirectoryAdministration(registry);
  registerChecklistTemplates(registry);
  registerTimeTracking(registry);
  registerIterationsAndSprints(registry);
  registerServiceDesk(registry);
  registerDocumentsAndGroups(registry);
  registerAutomations(registry);
  registerActivityAndAudit(registry);
  registerIncomingCardWebhooks(registry);
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
  registerAdvancedComments(registry, maximum);
  registerFiles(registry, maximum, configuration.origin);
  registerCanonicalPages(registry);
  return {server, registry};
}

export function createServer(
  configuration: Configuration,
  shutdownSignal: AbortSignal,
) {
  const {server, registry} = createToolRegistry(configuration, shutdownSignal);
  registry.register(canonicalCatalog);
  return {server};
}
