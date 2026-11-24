import assert from 'node:assert/strict';
import {test} from 'node:test';
import {catalogDomains} from '../src/catalog.ts';
import {canonicalCatalog} from '../src/catalog/index.ts';
import {readCatalog} from '../tools/read-catalog.ts';
import {startHarness} from './harness.ts';

test('the default packaged surface has all seven coordinated read/write pairs', async () => {
  const {tools} = await readCatalog();
  const names = catalogDomains.flatMap(domain => [
    `kaiten_${domain}_read`,
    `kaiten_${domain}_write`,
  ]);
  assert.deepEqual(tools.map(tool => tool.name).sort(), names.sort());
  for (const tool of tools) {
    assert.equal(tool.annotations?.readOnlyHint, tool.name.endsWith('_read'));
    assert.ok(tool.description, `${tool.name} has no description`);
    assert.ok(tool.description.trim(), `${tool.name} has an empty description`);
    assert.ok(tool.outputSchema, `${tool.name} has no output schema`);
    assert.doesNotMatch(
      tool.description,
      /full API fields and JSON response|Connection context \(JSON\)/i,
    );
  }
});

test('every v2 operation is accounted for in the canonical catalog', async context => {
  const legacy = await startHarness(context);
  const represented = new Set<string>();
  for (const tool of Object.values(canonicalCatalog)) {
    for (const routes of Object.values(tool.operations)) {
      for (const route of 'source' in routes ? [routes] : routes) {
        represented.add(route.source);
        for (const replaced of route.replaces ?? []) represented.add(replaced);
      }
    }
  }
  assert.deepEqual(
    [...legacy.operations.keys()].filter(name => !represented.has(name)),
    [],
    'Every legacy operation must map to a canonical route.',
  );
});
