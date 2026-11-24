import assert from 'node:assert/strict';
import {test} from 'node:test';
import {KaitenClient} from '@2chevskii/kaiten-client';
import {KaitenScimClient} from '@2chevskii/kaiten-client/scim';
import {startHarness} from './harness.ts';

test('the catalogs cover every public REST and SCIM resource method', async context => {
  const legacy = await startHarness(context);
  const canonical = await startHarness(context, 30_000, {
    KAITEN_TOOL_PROFILE: 'canonical',
  });
  const canonicalMethods = new Map([
    ['iterations.removeCardsFromIteration', 'remove_iteration_member'],
  ]);
  const client = new KaitenClient({
    origin: 'https://example.invalid',
    token: 'fixture',
  });
  for (const resource of Object.keys(client) as (keyof KaitenClient)[]) {
    for (const method of Object.keys(client[resource])) {
      const name = `${resource}.${method}`;
      const canonicalName = canonicalMethods.get(name);
      assert.ok(
        canonicalName === undefined
          ? legacy.operations.has(name)
          : canonical.operations.has(canonicalName),
        `${name} is missing`,
      );
    }
  }
  const scim = new KaitenScimClient({
    origin: 'https://example.invalid',
    token: 'fixture',
  });
  for (const resource of Object.keys(scim) as (keyof KaitenScimClient)[]) {
    for (const method of Object.keys(scim[resource])) {
      assert.ok(
        legacy.operations.has(`scim.${resource}.${method}`),
        `scim.${resource}.${method} is missing`,
      );
    }
  }
});
