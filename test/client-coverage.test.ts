import assert from 'node:assert/strict';
import {test} from 'node:test';
import {KaitenClient} from '@2chevskii/kaiten-client';
import {KaitenScimClient} from '@2chevskii/kaiten-client/scim';
import {startHarness} from './harness.ts';

test('advanced operations cover every public REST and SCIM resource method', async context => {
  const harness = await startHarness(context);
  const client = new KaitenClient({
    origin: 'https://example.invalid',
    token: 'fixture',
  });
  for (const resource of Object.keys(client) as (keyof KaitenClient)[]) {
    for (const method of Object.keys(client[resource])) {
      assert.ok(
        harness.operations.has(`${resource}.${method}`),
        `${resource}.${method} is missing`,
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
        harness.operations.has(`scim.${resource}.${method}`),
        `scim.${resource}.${method} is missing`,
      );
    }
  }
});
