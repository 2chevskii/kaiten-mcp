import assert from 'node:assert/strict';
import {test} from 'node:test';
import {startHarness, token} from './harness.ts';

const key = {addon_uid: 'addon/uid', user_id: 5, company_id: 7};

test('addon OAuth uses its configured secret for both public methods and returns token variants', async context => {
  const addonSecret = 'fixture-addon-secret';
  const harness = await startHarness(context, 30_000, {
    KAITEN_ADDON_SECRET: addonSecret,
  });
  for (const [operation, method, path, response] of [
    [
      'get_addon_token',
      'GET',
      '/api/v1/addon-oauth/addon%2Fuid/tokens/5/7',
      {
        has_token: true,
        access_token: 'returned-token',
        expires_at: '2027-01-01T00:00:00Z',
        domain: 'example.kaiten.ru',
      },
    ],
    [
      'refresh_addon_token',
      'POST',
      '/api/v1/addon-oauth/addon%2Fuid/tokens/5/7/refresh',
      {has_token: false, domain: 'example.kaiten.ru'},
    ],
  ] as const) {
    harness.reply(response);
    const result = await harness.call(operation, key);
    assert.equal(result.isError, undefined);
    assert.deepEqual(result.structuredContent, {result: response});
    assert.deepEqual(harness.requests.at(-1), {
      method,
      path,
      query: {},
      body: undefined,
      authorization: `Bearer ${addonSecret}`,
    });
    assert.equal(
      harness.operations.get(operation)?.tool,
      method === 'GET' ? 'kaiten_workspace_read' : 'kaiten_workspace_write',
    );
  }
  harness.reply([]);
  await harness.call('list_spaces');
  assert.equal(harness.requests.at(-1)?.authorization, `Bearer ${token}`);
  harness.reply({message: `${addonSecret} ${token}`}, 403);
  const error = await harness.call('refresh_addon_token', key);
  assert.equal(error.isError, true);
  assert.match(JSON.stringify(error), /KAITEN_HTTP_ERROR/);
  assert.ok(!JSON.stringify(error).includes(addonSecret));
  assert.ok(!JSON.stringify(error).includes(token));
  assert.equal(harness.requests.length, 4);
  assert.equal(harness.stderr, '');
});

test('addon OAuth operations remain discoverable without credentials and fail safely before HTTP', async context => {
  const harness = await startHarness(context);
  for (const operation of ['get_addon_token', 'refresh_addon_token']) {
    assert.ok(harness.operations.has(operation));
    const result = await harness.call(operation, key);
    assert.equal(result.isError, true);
    assert.match(JSON.stringify(result), /CONFIGURATION_ERROR/);
    assert.match(JSON.stringify(result), /KAITEN_ADDON_SECRET/);
  }
  assert.equal(harness.requests.length, 0);
});
