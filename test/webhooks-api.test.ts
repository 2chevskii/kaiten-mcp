import assert from 'node:assert/strict';
import {once} from 'node:events';
import {test} from 'node:test';
import {cardFixture, startHarness, token} from './harness.ts';

test('incoming webhook forwards every native field and complete JSON without API credentials', async context => {
  const harness = await startHarness(context);
  const body = {
    title: 'Webhook card',
    description: '',
    asap: false,
    due_date: '2026-12-01',
    owner_id: 5,
    links: [{url: 'https://example.com', description: null}],
    members: [5, 6],
    tags: ['Backend'],
    properties: {id_7: {nested: [0, false, null]}},
  };
  harness.reply({...cardFixture, uid: 'card-uid', extra: {preserved: true}});
  const result = await harness.call('sendCardWebhook', {
    webhook_url: `${harness.origin}/incoming/secret-path`,
    body,
  });
  assert.deepEqual(result.structuredContent, {
    result: {...cardFixture, uid: 'card-uid', extra: {preserved: true}},
  });
  assert.deepEqual(harness.requests, [
    {
      method: 'POST',
      path: '/incoming/secret-path',
      query: {},
      body,
      authorization: undefined,
    },
  ]);
  assert.equal(
    harness.operations.get('sendCardWebhook')?.tool,
    'kaiten_cards_write',
  );
  assert.equal(harness.stderr, '');
});

test('incoming webhook validates URLs and bodies, sanitizes errors, and never follows redirects', async context => {
  const harness = await startHarness(context);
  for (const webhook_url of [
    'bad',
    'http://example.com/path',
    'file:///tmp/path',
    'https://user:password@example.com/path',
  ]) {
    assert.equal(
      (
        await harness.call('sendCardWebhook', {
          webhook_url,
          body: {title: 'Fixture'},
        })
      ).isError,
      true,
    );
  }
  assert.equal(
    (
      await harness.call('sendCardWebhook', {
        webhook_url: `${harness.origin}/incoming`,
        body: {title: 'Fixture', unknown: true},
      })
    ).isError,
    true,
  );
  assert.equal(harness.requests.length, 0);
  for (const status of [403, 404, 413]) {
    harness.reply({message: token}, status);
    const result = await harness.call('sendCardWebhook', {
      webhook_url: `${harness.origin}/incoming`,
      body: {title: 'Fixture'},
    });
    assert.equal(result.isError, true);
    const content = result.content[0];
    assert.equal(content?.type, 'text');
    if (content?.type === 'text')
      assert.equal(
        (JSON.parse(content.text) as {status: number}).status,
        status,
      );
    assert.ok(!JSON.stringify(result).includes(token));
  }
  harness.respond((_request, response) => {
    response.writeHead(302, {location: `${harness.origin}/redirect-target`});
    response.end();
  });
  assert.equal(
    (
      await harness.call('sendCardWebhook', {
        webhook_url: `${harness.origin}/incoming`,
        body: {title: 'Fixture'},
      })
    ).isError,
    true,
  );
  assert.equal(harness.requests.length, 4);
});

test('incoming webhook request shares the configured timeout', async context => {
  const harness = await startHarness(context, 300);
  harness.respond(() => {});
  const received = once(harness.events, 'request', {
    signal: AbortSignal.timeout(5000),
  });
  const pending = harness.call('sendCardWebhook', {
    webhook_url: `${harness.origin}/incoming`,
    body: {title: 'Fixture'},
  });
  const [, response] = await received;
  const closed = once(response, 'close', {signal: AbortSignal.timeout(5000)});
  assert.match(JSON.stringify(await pending), /TIMEOUT/);
  await closed;
  assert.equal(harness.requests.length, 1);
});
