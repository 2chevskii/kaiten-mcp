import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {test} from 'node:test';
import {startHarness} from './harness.ts';
import {temporaryDirectory} from './temporary-directory.ts';

test('canonical stdio profile routes identity through workspace without copying private context into its catalog', async context => {
  const directory = temporaryDirectory(context);
  const preferences = join(directory, 'context.json');
  const privateInstruction = 'Fixture-only private workspace guidance.';
  writeFileSync(
    preferences,
    JSON.stringify({user_id: 42, instructions: privateInstruction}),
  );
  const harness = await startHarness(context, 30_000, {
    KAITEN_TOOL_PROFILE: 'canonical',
    KAITEN_CONTEXT_FILE: preferences,
  });
  const instructions = harness.client.getInstructions();
  assert.match(
    instructions ?? '',
    /kaiten_workspace_read operation get_current_user/,
  );
  assert.ok(instructions?.includes(privateInstruction));
  const {tools} = await harness.client.listTools();
  assert.equal(
    tools.some(tool => tool.name === 'kaiten_navigation_read'),
    false,
  );
  assert.equal(JSON.stringify(tools).includes(privateInstruction), false);
  assert.equal(JSON.stringify(tools).includes('fixture-only-secret'), false);
  assert.equal(
    harness.operations.get('get_current_user')?.tool,
    'kaiten_workspace_read',
  );
  const workspace = tools.find(tool => tool.name === 'kaiten_workspace_read');
  assert.ok(workspace?.outputSchema);
  assert.equal(workspace.outputSchema.type, 'object');
  assert.equal(workspace.annotations?.readOnlyHint, true);
  assert.equal(harness.requests.length, 0);
  harness.reply({id: 7, full_name: 'Token Account'});
  const result = await harness.call('get_current_user');
  assert.deepEqual(result.structuredContent, {
    item: {id: 7, full_name: 'Token Account'},
  });
  assert.equal(harness.requests.length, 1);
});
