import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {test} from 'node:test';
import {readConfiguration} from '../src/config.ts';
import {startHarness} from './harness.ts';
import {temporaryDirectory} from './temporary-directory.ts';

test('API-version selection and rotating token providers work through real REST, SCIM, and OAuth requests', async context => {
  const directory = temporaryDirectory(context);
  const tokenPath = join(directory, 'api-token');
  const addonPath = join(directory, 'addon-token');
  writeFileSync(tokenPath, ' first-token\n');
  writeFileSync(addonPath, 'first-addon\n');
  const harness = await startHarness(context, 30_000, {
    KAITEN_TOKEN: '',
    KAITEN_TOKEN_FILE: tokenPath,
    KAITEN_ADDON_SECRET_FILE: addonPath,
    KAITEN_API_VERSION: 'latest',
  });
  harness.reply([]);
  await harness.call('spaces.retrieveListOfSpaces');
  assert.equal(harness.requests.at(-1)?.path, '/api/latest/spaces');
  assert.equal(harness.requests.at(-1)?.authorization, 'Bearer first-token');
  writeFileSync(tokenPath, 'second-token');
  harness.reply({
    Resources: [],
    totalResults: 0,
    startIndex: 1,
    itemsPerPage: 0,
  });
  await harness.call('scim.users.getUsers');
  assert.equal(harness.requests.at(-1)?.path, '/scim/v2/Users');
  assert.equal(harness.requests.at(-1)?.authorization, 'Bearer second-token');
  const key = {addon_uid: 'uid', user_id: 5, company_id: 7};
  harness.reply({has_token: false});
  await harness.call('addonOAuth.getToken', key);
  assert.equal(
    harness.requests.at(-1)?.path,
    '/api/v1/addon-oauth/uid/tokens/5/7',
  );
  assert.equal(harness.requests.at(-1)?.authorization, 'Bearer first-addon');
  writeFileSync(addonPath, 'second-addon');
  await harness.call('addonOAuth.refreshToken', key);
  assert.equal(harness.requests.at(-1)?.authorization, 'Bearer second-addon');
  assert.equal(harness.requests.length, 4);
  assert.equal(harness.stderr, '');
});

test('file credential failures are safe, lazy, and prevent outgoing requests', async context => {
  const directory = temporaryDirectory(context);
  const tokenPath = join(directory, 'private-path-secret');
  const harness = await startHarness(context, 30_000, {
    KAITEN_TOKEN: '',
    KAITEN_TOKEN_FILE: tokenPath,
  });
  for (const content of [undefined, '', ' \n']) {
    if (content !== undefined) writeFileSync(tokenPath, content);
    const result = await harness.call('spaces.retrieveListOfSpaces');
    assert.equal(result.isError, true);
    assert.match(JSON.stringify(result), /CONFIGURATION_ERROR/);
    assert.ok(!JSON.stringify(result).includes('private-path-secret'));
  }
  assert.equal(harness.requests.length, 0);
  writeFileSync(tokenPath, 'recovered-token');
  harness.reply([]);
  assert.equal(
    (await harness.call('spaces.retrieveListOfSpaces')).isError,
    undefined,
  );
  assert.equal(
    harness.requests.at(-1)?.authorization,
    'Bearer recovered-token',
  );
});

test('connection settings validate conflicts, API versions, and resolve relative credential paths at startup', async context => {
  const directory = temporaryDirectory(context);
  const base = {
    KAITEN_ORIGIN: 'https://example.kaiten.ru',
    KAITEN_TOKEN: 'token',
  };
  const locations = {cwd: directory, home: directory};
  for (const settings of [
    {KAITEN_TOKEN_FILE: 'token-file'},
    {KAITEN_TOKEN_FILE: ''},
    {KAITEN_ADDON_SECRET: 'secret', KAITEN_ADDON_SECRET_FILE: 'file'},
    {KAITEN_ADDON_SECRET_FILE: ' '},
    ...['v2', '', 'V1'].map(KAITEN_API_VERSION => ({KAITEN_API_VERSION})),
  ])
    assert.throws(() => readConfiguration({...base, ...settings}, locations));
  assert.equal(
    readConfiguration({...base, KAITEN_API_VERSION: ' v1 '}, locations)
      .apiVersion,
    'v1',
  );
  writeFileSync(join(directory, 'token-file'), 'relative-token');
  const configuration = readConfiguration(
    {...base, KAITEN_TOKEN: '', KAITEN_TOKEN_FILE: './token-file'},
    locations,
  );
  assert.equal(typeof configuration.token, 'function');
  if (typeof configuration.token === 'function')
    assert.equal(await configuration.token(), 'relative-token');
});
