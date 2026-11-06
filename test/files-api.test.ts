import assert from 'node:assert/strict';
import {EventEmitter, once} from 'node:events';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import {test, type TestContext} from 'node:test';
import type {CallToolResult} from '@modelcontextprotocol/client';
import {cardUid, commentUid, fileUid, propertyUid} from './file-cases.ts';
import {cardFixture, startHarness, token} from './harness.ts';

function errorPayload(result: CallToolResult) {
  assert.equal(result.isError, true);
  const content = result.content[0];
  assert.equal(content?.type, 'text');
  if (content?.type !== 'text') throw new Error('Expected text error.');
  return JSON.parse(content.text) as {code: string; status?: number};
}

async function startStorage(context: TestContext) {
  const requests: {path: string; authorization?: string; cookie?: string}[] =
    [];
  const events = new EventEmitter();
  let respond = (_request: IncomingMessage, response: ServerResponse) => {
    response.end();
  };
  const server = createServer((request, response) => {
    requests.push({
      path: request.url!,
      ...(request.headers.authorization === undefined
        ? {}
        : {authorization: request.headers.authorization}),
      ...(request.headers.cookie === undefined
        ? {}
        : {cookie: request.headers.cookie}),
    });
    respond(request, response);
    events.emit('request', response);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Expected TCP address.');
  context.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve())),
    );
  });
  return {
    origin: `http://127.0.0.1:${address.port}`,
    requests,
    events,
    respond(
      handler: (request: IncomingMessage, response: ServerResponse) => void,
    ) {
      respond = handler;
    },
  };
}

const cardKey = {card_uid: cardUid, file_uid: fileUid};

test('all restricted download helpers return exact MCP binary resources through unauthenticated storage redirects', async context => {
  const harness = await startHarness(context, 30_000, {
    KAITEN_MAX_FILE_BYTES: '4',
  });
  const storage = await startStorage(context);
  const bytes = Buffer.from([0, 255, 65, 10]);
  storage.respond((request, response) => {
    if (request.url === '/signed?private=value') {
      response.writeHead(302, {location: '/content'});
      response.end();
    } else {
      response.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': bytes.length,
      });
      response.end(bytes);
    }
  });
  harness.respond((_request, response) => {
    response.writeHead(302, {
      location: `${storage.origin}/signed?private=value`,
    });
    response.end();
  });
  for (const [operation, args, path, uri] of [
    [
      'download_card_file',
      cardKey,
      `/api/v1/cards/${cardUid}/files/${fileUid}`,
      `kaiten-file://cards/${cardUid}/${fileUid}`,
    ],
    [
      'download_comment_file',
      {...cardKey, comment_uid: commentUid},
      `/api/v1/cards/${cardUid}/comments/${commentUid}/files/${fileUid}`,
      `kaiten-file://comments/${cardUid}/${commentUid}/${fileUid}`,
    ],
    [
      'download_custom_property_file',
      {...cardKey, property_uid: propertyUid},
      `/api/v1/cards/${cardUid}/custom-properties/${propertyUid}/files/${fileUid}`,
      `kaiten-file://custom-properties/${cardUid}/${propertyUid}/${fileUid}`,
    ],
  ] as const) {
    const result = await harness.call(operation, args);
    assert.equal(result.isError, undefined, JSON.stringify(result));
    assert.deepEqual(result.structuredContent, {
      file: {uri, mime_type: 'application/octet-stream', size_bytes: 4},
    });
    assert.deepEqual(result.content, [
      {type: 'text', text: JSON.stringify(result.structuredContent)},
      {
        type: 'resource',
        resource: {
          uri,
          mimeType: 'application/octet-stream',
          blob: bytes.toString('base64'),
        },
      },
    ]);
    assert.deepEqual(harness.requests.at(-1), {
      method: 'GET',
      path,
      query: {redirect: 'true', download: 'true'},
      body: undefined,
      authorization: `Bearer ${token}`,
    });
    assert.ok(!JSON.stringify(result).includes('private=value'));
  }
  assert.equal(storage.requests.length, 6);
  assert.ok(
    storage.requests.every(
      request =>
        request.authorization === undefined && request.cookie === undefined,
    ),
  );
  assert.equal(harness.stderr, '');
  assert.deepEqual(harness.protocolErrors, []);
});

test('file listing preserves legacy and restricted metadata, pages locally, and resolves legacy retrieval', async context => {
  const harness = await startHarness(context);
  const storage = await startStorage(context);
  storage.respond((_request, response) => {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end('old');
  });
  const legacy = {
    id: 20,
    name: 'old.txt',
    type: 1,
    url: `${storage.origin}/old`,
    extra: {preserved: false},
  };
  const restricted = {
    id: fileUid,
    name: 'new.txt',
    type: 11,
    entity_type: 'card',
    card_uid: cardUid,
    size: '4',
  };
  harness.reply({...cardFixture, uid: cardUid, files: [legacy, restricted]});
  assert.deepEqual(
    (await harness.call('list_card_files', {card_id: 10, limit: 1}))
      .structuredContent,
    {card_uid: cardUid, items: [legacy], next_offset: 1},
  );
  assert.deepEqual(
    (await harness.call('list_card_files', {card_id: 10, limit: 1, offset: 1}))
      .structuredContent,
    {card_uid: cardUid, items: [restricted], next_offset: null},
  );
  assert.deepEqual(
    (await harness.call('get_legacy_card_file', {card_id: 10, file_id: 20}))
      .structuredContent,
    {result: legacy},
  );
  assert.deepEqual(
    errorPayload(
      await harness.call('get_legacy_card_file', {card_id: 10, file_id: 99}),
    ),
    {
      code: 'FILE_NOT_FOUND',
      message: 'The file is not attached to this card.',
      status: 404,
    },
  );
  const download = await harness.call('download_legacy_card_file', {
    card_id: 10,
    file_id: 20,
  });
  const resource = download.content[1];
  assert.equal(resource?.type, 'resource');
  if (resource?.type === 'resource' && 'blob' in resource.resource)
    assert.equal(
      Buffer.from(resource.resource.blob, 'base64').toString(),
      'old',
    );
  else assert.fail('Expected embedded binary resource.');
  assert.deepEqual(storage.requests, [{path: '/old'}]);
  assert.ok(
    harness.requests.every(
      request =>
        request.path === '/api/v1/cards/10' &&
        Object.keys(request.query).length === 0,
    ),
  );
  harness.reply({files: []});
  assert.deepEqual(
    (await harness.call('list_card_files', {card_id: 10})).structuredContent,
    {card_uid: null, items: [], next_offset: null},
  );
  harness.reply({files: null});
  assert.equal(
    errorPayload(await harness.call('list_card_files', {card_id: 10})).code,
    'INVALID_KAITEN_RESPONSE',
  );
});

test('native file reads expose metadata and redirect overloads without fetching content', async context => {
  const harness = await startHarness(context);
  const location = `${harness.origin}/signed-content`;
  harness.respond((_request, response) => {
    response.writeHead(302, {location});
    response.end();
  });
  for (const [operation, args] of [
    [
      'restrictedAccessCardFiles.getCardFile',
      {...cardKey, redirect: true, download: false},
    ],
    [
      'restrictedAccessCommentFiles.getCommentFile',
      {...cardKey, comment_uid: commentUid, query: {redirect: true}},
    ],
    [
      'restrictedAccessCustomPropertyFiles.getCustomPropertyFile',
      {...cardKey, property_uid: propertyUid, query: {redirect: true}},
    ],
  ] as const) {
    assert.deepEqual((await harness.call(operation, args)).structuredContent, {
      result: {location},
    });
  }
  assert.equal(harness.requests.length, 3);
  harness.reply({id: fileUid});
  assert.equal(
    errorPayload(await harness.call('download_card_file', cardKey)).code,
    'INVALID_KAITEN_RESPONSE',
  );
});

test('uploads validate canonical base64 and byte caps before HTTP, preserve empty files, and use client filename defaults', async context => {
  const harness = await startHarness(context, 30_000, {
    KAITEN_MAX_FILE_BYTES: '4',
  });
  for (const data_base64 of [
    'a',
    'YQ',
    'YR==',
    'YQ==\n',
    'data:;base64,YQ==',
    '!@#$',
  ]) {
    const result = await harness.call(
      'restrictedAccessCardFiles.attachFileToCard',
      {card_uid: cardUid, file: {data_base64}},
    );
    assert.equal(result.isError, true);
    assert.ok(
      ['INVALID_FILE_DATA', 'FILE_TOO_LARGE'].includes(
        errorPayload(result).code,
      ),
    );
  }
  for (const data_base64 of ['AQIDBAU=', 'AAAAAAAAAAAA']) {
    assert.equal(
      errorPayload(
        await harness.call('cardFiles.attachFileToCard', {
          card_id: 10,
          file: {data_base64},
        }),
      ).code,
      'FILE_TOO_LARGE',
    );
  }
  assert.equal(
    (
      await harness.call('restrictedAccessCardFiles.attachFileToCard', {
        card_uid: 'invalid',
        file: {data_base64: ''},
      })
    ).isError,
    true,
  );
  assert.equal(harness.requests.length, 0);
  harness.reply({id: fileUid});
  for (const data_base64 of ['', 'AP9BCg==']) {
    const result = await harness.call(
      'restrictedAccessCardFiles.attachFileToCard',
      {card_uid: cardUid, file: {data_base64}},
    );
    assert.equal(result.isError, undefined);
    assert.deepEqual(harness.requests.at(-1)?.body, {
      parts: [
        {
          name: 'file',
          filename: 'file',
          mime_type: 'application/octet-stream',
          data_base64,
        },
      ],
    });
  }
});

test('advanced comment FormData retains ordered duplicate fields and exact file bytes, with an aggregate byte cap', async context => {
  const harness = await startHarness(context, 30_000, {
    KAITEN_MAX_FILE_BYTES: '4',
  });
  const form = [
    {name: 'text', value: 'Comment'},
    {
      name: 'files[]',
      file: {
        data_base64: 'AP8=',
        filename: 'first.bin',
        mime_type: 'application/octet-stream',
      },
    },
    {name: 'text', value: ''},
    {
      name: 'files[]',
      file: {
        data_base64: 'QUI=',
        filename: 'second.txt',
        mime_type: 'text/plain',
      },
    },
  ];
  const expected = {
    parts: [
      {name: 'text', value: 'Comment'},
      {
        name: 'files[]',
        data_base64: 'AP8=',
        filename: 'first.bin',
        mime_type: 'application/octet-stream',
      },
      {name: 'text', value: ''},
      {
        name: 'files[]',
        data_base64: 'QUI=',
        filename: 'second.txt',
        mime_type: 'text/plain',
      },
    ],
  };
  harness.reply({id: 30, uid: commentUid, attacments: [{id: fileUid}]});
  for (const operation of [
    'cardComments.addComment',
    'cardComments.updateComment',
  ]) {
    const result = await harness.call(operation, {
      card_id: 10,
      ...(operation.endsWith('updateComment') ? {comment_id: 30} : {}),
      form,
    });
    assert.equal(result.isError, undefined, JSON.stringify(result));
    assert.deepEqual(result.structuredContent, {
      result: {id: 30, uid: commentUid, attacments: [{id: fileUid}]},
    });
    assert.deepEqual(harness.requests.at(-1)?.body, expected);
  }
  const before = harness.requests.length;
  for (const args of [
    {card_id: 10},
    {card_id: 10, body: {text: 'both'}, form},
    {
      card_id: 10,
      form: [{name: 'text', value: 'both', file: {data_base64: ''}}],
    },
  ])
    assert.equal(
      (await harness.call('cardComments.addComment', args)).isError,
      true,
    );
  assert.equal(
    errorPayload(
      await harness.call('cardComments.addComment', {
        card_id: 10,
        form: [
          {name: 'files[]', file: {data_base64: 'QUJD'}},
          {name: 'files[]', file: {data_base64: 'REVG'}},
        ],
      }),
    ).code,
    'FILE_TOO_LARGE',
  );
  assert.equal(harness.requests.length, before);
});

test('Kaiten attachment access, missing-file and installation-size errors retain status without retrying writes', async context => {
  const harness = await startHarness(context);
  for (const status of [403, 404, 413]) {
    harness.reply({message: `private ${token}`}, status);
    const before = harness.requests.length;
    const result = await harness.call(
      'restrictedAccessCardFiles.attachFileToCard',
      {card_uid: cardUid, file: {data_base64: ''}},
    );
    assert.deepEqual(errorPayload(result), {
      code: 'KAITEN_HTTP_ERROR',
      message: `Kaiten returned HTTP ${status}.`,
      status,
    });
    assert.ok(!JSON.stringify(result).includes(token));
    assert.equal(harness.requests.length, before + 1);
  }
});

test('downloads enforce declared and streamed byte limits and sanitize storage HTTP errors', async context => {
  const harness = await startHarness(context, 30_000, {
    KAITEN_MAX_FILE_BYTES: '4',
  });
  const storage = await startStorage(context);
  harness.respond((_request, response) => {
    response.writeHead(302, {
      location: `${storage.origin}/private-signed-location`,
    });
    response.end();
  });
  storage.respond((_request, response) => {
    response.writeHead(200, {'Content-Length': '5'});
    response.end('12345');
  });
  assert.equal(
    errorPayload(await harness.call('download_card_file', cardKey)).code,
    'FILE_TOO_LARGE',
  );
  storage.respond((_request, response) => {
    response.writeHead(200);
    response.write('1234');
    response.end('5');
  });
  assert.equal(
    errorPayload(await harness.call('download_card_file', cardKey)).code,
    'FILE_TOO_LARGE',
  );
  for (const status of [403, 404, 413]) {
    storage.respond((_request, response) => {
      response.writeHead(status);
      response.end(`private ${token}`);
    });
    const result = await harness.call('download_card_file', cardKey);
    assert.deepEqual(errorPayload(result), {
      code: 'FILE_DOWNLOAD_HTTP_ERROR',
      message: `File storage returned HTTP ${status}.`,
      status,
    });
    assert.ok(!JSON.stringify(result).includes('private'));
    assert.ok(!JSON.stringify(result).includes(token));
  }
  storage.respond((_request, response) => {
    response.writeHead(204);
    response.end();
  });
  const empty = await harness.call('download_card_file', cardKey);
  assert.equal(empty.isError, undefined);
  assert.deepEqual((empty.structuredContent as {file: unknown}).file, {
    uri: `kaiten-file://cards/${cardUid}/${fileUid}`,
    mime_type: 'application/octet-stream',
    size_bytes: 0,
  });
  const resource = empty.content[1];
  assert.equal(resource?.type, 'resource');
  if (resource?.type === 'resource' && 'blob' in resource.resource)
    assert.equal(resource.resource.blob, '');
  else assert.fail('Expected embedded binary resource.');
});

test('downloads validate every redirect URL and bound redirect chains', async context => {
  const harness = await startHarness(context);
  const storage = await startStorage(context);
  for (const location of [
    'http://example.invalid/private',
    'file:///private',
    'https://user:private@example.invalid/file',
  ]) {
    harness.respond((_request, response) => {
      response.writeHead(302, {location});
      response.end();
    });
    const result = await harness.call('download_card_file', cardKey);
    assert.equal(errorPayload(result).code, 'INVALID_FILE_URL');
    assert.ok(!JSON.stringify(result).includes('private'));
  }
  assert.equal(storage.requests.length, 0);
  harness.respond((_request, response) => {
    response.writeHead(302, {location: `${storage.origin}/loop`});
    response.end();
  });
  storage.respond((_request, response) => {
    response.writeHead(302, {location: 'http://example.invalid/private'});
    response.end();
  });
  assert.equal(
    errorPayload(await harness.call('download_card_file', cardKey)).code,
    'INVALID_FILE_URL',
  );
  assert.equal(storage.requests.length, 1);
  storage.respond((_request, response) => {
    response.writeHead(302, {location: '/loop'});
    response.end();
  });
  assert.equal(
    errorPayload(await harness.call('download_card_file', cardKey)).code,
    'FILE_DOWNLOAD_REDIRECT_ERROR',
  );
  assert.equal(storage.requests.length, 7);
});

test('the download timeout aborts storage reads after the Kaiten redirect', async context => {
  const harness = await startHarness(context, 300);
  const storage = await startStorage(context);
  harness.respond((_request, response) => {
    response.writeHead(302, {location: `${storage.origin}/pending`});
    response.end();
  });
  storage.respond((_request, response) => {
    response.writeHead(200);
    response.write('x');
  });
  const received = once(storage.events, 'request', {
    signal: AbortSignal.timeout(5000),
  });
  const pending = harness.call('download_card_file', cardKey);
  const [response] = (await received) as [ServerResponse];
  const closed = once(response, 'close', {signal: AbortSignal.timeout(5000)});
  assert.equal(errorPayload(await pending).code, 'TIMEOUT');
  await closed;
});

test('MCP cancellation aborts an in-flight storage download', async context => {
  const harness = await startHarness(context);
  const storage = await startStorage(context);
  harness.respond((_request, response) => {
    response.writeHead(302, {location: `${storage.origin}/pending`});
    response.end();
  });
  storage.respond((_request, response) => {
    response.writeHead(200);
    response.write('x');
  });
  const controller = new AbortController();
  const received = once(storage.events, 'request', {
    signal: AbortSignal.timeout(5000),
  });
  const pending = harness.client.callTool(
    {
      name: 'kaiten_files_read',
      arguments: {request: {operation: 'download_card_file', args: cardKey}},
    },
    {signal: controller.signal},
  );
  const rejected = assert.rejects(pending);
  const [response] = (await received) as [ServerResponse];
  const closed = once(response, 'close', {signal: AbortSignal.timeout(5000)});
  controller.abort();
  await rejected;
  await closed;
});
