import assert from 'node:assert/strict';
import {test} from 'node:test';
import {KaitenClient} from '@2chevskii/kaiten-client';
import {startHarness} from './harness.ts';

test('advanced operations cover every public method in the implemented client domains', async context => {
  const harness = await startHarness(context);
  const client = new KaitenClient({
    origin: 'https://example.invalid',
    token: 'fixture',
  });
  for (const resource of [
    'spaces',
    'spaceBoards',
    'boards',
    'columns',
    'subcolumn',
    'lanes',
    'cards',
  ] as const) {
    for (const method of Object.keys(client[resource])) {
      assert.ok(
        harness.operations.has(`${resource}.${method}`),
        `${resource}.${method} is missing`,
      );
    }
  }
});
