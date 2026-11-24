import assert from 'node:assert/strict';
import {test} from 'node:test';
import {KaitenClient} from '@2chevskii/kaiten-client';
import {KaitenScimClient} from '@2chevskii/kaiten-client/scim';
import {canonicalCatalog} from '../src/catalog/index.ts';
import {startHarness} from './harness.ts';

test('the canonical catalog covers every public REST and SCIM resource method', async context => {
  const harness = await startHarness(context);
  const represented = new Set<string>();
  for (const tool of Object.values(canonicalCatalog)) {
    for (const [name, routes] of Object.entries(tool.operations)) {
      assert.ok(harness.operations.has(name), name);
      for (const route of 'source' in routes ? [routes] : routes) {
        represented.add(route.source);
        for (const replaced of route.replaces ?? []) represented.add(replaced);
      }
    }
  }
  const client = new KaitenClient({
    origin: 'https://example.invalid',
    token: 'fixture',
  });
  for (const resource of Object.keys(client) as (keyof KaitenClient)[]) {
    for (const method of Object.keys(client[resource])) {
      const name = `${resource}.${method}`;
      assert.ok(represented.has(name), `${name} is missing`);
    }
  }
  const scim = new KaitenScimClient({
    origin: 'https://example.invalid',
    token: 'fixture',
  });
  for (const resource of Object.keys(scim) as (keyof KaitenScimClient)[]) {
    for (const method of Object.keys(scim[resource])) {
      assert.ok(
        represented.has(`scim.${resource}.${method}`),
        `scim.${resource}.${method} is missing`,
      );
    }
  }
});
