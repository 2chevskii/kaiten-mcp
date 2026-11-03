import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {writeFileSync, unlinkSync, mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname, relative} from 'node:path';
import {test, type TestContext} from 'node:test';
import {readConfiguration} from '../src/config.ts';
import {cliPath, startHarness} from './harness.ts';
import {readModelContext} from '../src/model-context.ts';
import {temporaryDirectory} from './temporary-directory.ts';

function contextFile(context: TestContext, content: string): string {
  const path = join(tmpdir(), `kaiten-context-${randomUUID()}.json`);
  writeFileSync(path, content);
  context.after(() => unlinkSync(path));
  return path;
}

function writeContext(path: string, value: unknown): void {
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, JSON.stringify(value));
}

test('discovery merges home, project and nested context and stops at a worktree root', context => {
  const root = temporaryDirectory(context);
  const home = join(root, 'home');
  const project = join(root, 'project');
  const cwd = join(project, 'packages', 'service');
  const file = (directory: string) =>
    join(directory, '.agents', 'kaiten-mcp.context.json');
  writeContext(file(root), {user_id: 999, instructions: 'Outside project.'});
  writeContext(file(home), {
    user_id: 1,
    my_tasks_role: 'owner',
    instructions: 'Home rules.',
    spaces: [{id: 10, purpose: 'Home', guidance: 'Old guidance'}],
    boards: [{id: 20, purpose: 'Shared'}],
  });
  writeContext(file(project), {
    user_id: 2,
    instructions: 'Project rules.',
    spaces: [{id: 10, purpose: 'Project'}],
  });
  writeFileSync(join(project, '.git'), 'gitdir: ../worktree-metadata');
  writeContext(file(join(project, 'packages')), {
    instructions: 'Package rules.',
  });
  writeContext(file(cwd), {
    instructions: 'Local rules.',
    boards: [{id: 21, purpose: 'Local'}],
  });
  const locations = {cwd, home};
  assert.deepEqual(
    readConfiguration(
      {KAITEN_ORIGIN: 'https://example.kaiten.ru', KAITEN_TOKEN: 'fixture'},
      locations,
    ).context,
    {
      user_id: 2,
      my_tasks_role: 'owner',
      instructions:
        'Home rules.\n\nProject rules.\n\nPackage rules.\n\nLocal rules.',
      spaces: [{id: 10, purpose: 'Project'}],
      boards: [
        {id: 20, purpose: 'Shared'},
        {id: 21, purpose: 'Local'},
      ],
    },
  );
});

test('explicit paths replace discovery, resolve from cwd and merge left to right', context => {
  const root = temporaryDirectory(context);
  const locations = {cwd: root, home: root};
  writeContext(join(root, '.agents', 'kaiten-mcp.context.json'), {
    user_id: 999,
  });
  const first = join(root, 'base.json');
  const second = join(root, 'nested', 'override.json');
  writeContext(first, {
    user_id: 1,
    my_tasks_role: 'owner',
    instructions: 'First.',
    spaces: [{id: 10, purpose: 'Old'}],
    boards: [{id: 20, purpose: 'Old', space_id: 10, guidance: 'Remove me'}],
  });
  writeContext(second, {
    instructions: 'Second.',
    spaces: [],
    boards: [{id: 20, purpose: 'New'}],
  });
  assert.deepEqual(
    readModelContext(` ${first} , ${relative(root, second)} `, locations),
    {
      user_id: 1,
      my_tasks_role: 'owner',
      instructions: 'First.\n\nSecond.',
      spaces: [],
      boards: [{id: 20, purpose: 'New'}],
    },
  );
  assert.deepEqual(readModelContext(relative(root, second), locations), {
    instructions: 'Second.',
    spaces: [],
    boards: [{id: 20, purpose: 'New'}],
  });
  for (const paths of [
    '',
    ' ',
    `,${first}`,
    `${first},`,
    `${first}, ,${second}`,
    `${first},missing.json`,
  ]) {
    assert.throws(() => readModelContext(paths, locations));
  }
});

test('without Git only cwd and home are discovered, with identical paths loaded once', context => {
  const root = temporaryDirectory(context);
  const cwd = join(root, 'nested');
  writeContext(join(root, '.agents', 'kaiten-mcp.context.json'), {
    instructions: 'Home.',
  });
  writeContext(join(cwd, '.agents', 'kaiten-mcp.context.json'), {
    instructions: 'Local.',
  });
  assert.deepEqual(
    readModelContext(undefined, {cwd, home: join(root, 'missing-home')}),
    {instructions: 'Local.'},
  );
  assert.deepEqual(readModelContext(undefined, {cwd, home: cwd}), {
    instructions: 'Local.',
  });
  assert.equal(
    readModelContext(undefined, {
      cwd: join(root, 'absent'),
      home: join(root, 'missing-home'),
    }),
    undefined,
  );
});

test('invalid discovered files fail instead of falling back to inherited context', context => {
  const root = temporaryDirectory(context);
  const home = join(root, 'home');
  const cwd = join(root, 'project');
  const path = join(cwd, '.agents', 'kaiten-mcp.context.json');
  writeContext(join(home, '.agents', 'kaiten-mcp.context.json'), {user_id: 1});
  writeContext(path, {user_id: 0});
  assert.throws(() => readModelContext(undefined, {cwd, home}));
  writeFileSync(path, '{');
  assert.throws(() => readModelContext(undefined, {cwd, home}));
  unlinkSync(path);
  mkdirSync(path);
  assert.throws(() => readModelContext(undefined, {cwd, home}));
});

test('context loading validates strict JSON configuration', context => {
  const base = {
    KAITEN_ORIGIN: 'https://example.kaiten.ru',
    KAITEN_TOKEN: 'fixture',
  };
  const path = contextFile(context, '{}');
  assert.deepEqual(
    readConfiguration({...base, KAITEN_CONTEXT_FILE: path}).context,
    {},
  );
  for (const value of [
    '{',
    'null',
    '[]',
    '{"unknown":true}',
    '{"instructions":" "}',
    '{"user_id":0}',
    '{"user_id":1.5}',
    '{"user_id":9007199254740992}',
    '{"my_tasks_role":"assignee"}',
    '{"spaces":[{"id":1}]}',
    '{"boards":[{"id":2,"purpose":"Work","space_id":-1}]}',
  ]) {
    writeFileSync(path, value);
    assert.throws(() =>
      readConfiguration({...base, KAITEN_CONTEXT_FILE: path}),
    );
  }
  for (const invalidPath of ['', 'relative.json', `${path}.missing`]) {
    assert.throws(() =>
      readConfiguration({...base, KAITEN_CONTEXT_FILE: invalidPath}),
    );
  }
});

test('initialization and tool discovery expose personal identity guidance without Kaiten requests', async context => {
  const harness = await startHarness(context);
  const instructions = harness.client.getInstructions();
  assert.ok(instructions);
  assert.match(
    instructions.slice(0, 512),
    /token user returned by kaiten_get_current_user/,
  );
  assert.match(instructions.slice(0, 512), /Do not compare Kaiten names/);
  assert.match(instructions, /responsible_ids/);
  const {tools} = await harness.client.listTools();
  const identity = tools.find(tool => tool.name === 'kaiten_get_current_user');
  assert.ok(identity?.description?.includes(instructions));
  assert.match(
    tools.find(tool => tool.name === 'kaiten_search_cards')!.description!,
    /my tasks/,
  );
  assert.equal(harness.requests.length, 0);
});

test('connection preferences reach MCP clients and preserve the actual token identity', async context => {
  const preferences = {
    user_id: 42,
    my_tasks_role: 'member',
    instructions: 'Use the delivery board for delivery work.',
    spaces: [{id: 10, purpose: 'Engineering'}],
    boards: [
      {
        id: 20,
        space_id: 10,
        purpose: 'Delivery',
        guidance: 'Delivery requests only.',
      },
    ],
  };
  const basePath = contextFile(
    context,
    JSON.stringify({user_id: 99, instructions: 'General rules.'}),
  );
  const path = contextFile(context, JSON.stringify(preferences));
  const harness = await startHarness(context, 30_000, {
    KAITEN_CONTEXT_FILE: `${basePath},${path}`,
  });
  const instructions = harness.client.getInstructions()!;
  assert.match(instructions.slice(0, 512), /configured Kaiten user_id 42/);
  assert.match(instructions, /member_ids/);
  assert.deepEqual(
    JSON.parse(instructions.split('Connection context (JSON): ')[1]!),
    {
      ...preferences,
      instructions: `General rules.\n\n${preferences.instructions}`,
    },
  );
  assert.match(instructions, /Explicit user requests override/);
  assert.match(instructions, /not an access restriction/);
  assert.match(
    instructions,
    /validate it with kaiten_get_space or kaiten_get_board/,
  );
  assert.match(instructions, /do not silently substitute/);
  const {tools} = await harness.client.listTools();
  assert.ok(
    tools
      .find(tool => tool.name === 'kaiten_get_current_user')
      ?.description?.includes(instructions),
  );
  assert.equal(harness.requests.length, 0);
  harness.reply({id: 7, full_name: 'Token Account'});
  const result = await harness.call('get_current_user');
  assert.deepEqual(result.structuredContent, {
    item: {id: 7, full_name: 'Token Account'},
  });
  assert.equal(harness.requests.length, 1);
  assert.equal(harness.stderr, '');
});

test('the stdio server automatically exposes home context without an explicit file', async context => {
  const home = temporaryDirectory(context);
  writeContext(join(home, '.agents', 'kaiten-mcp.context.json'), {
    user_id: 42,
    my_tasks_role: 'owner',
  });
  const harness = await startHarness(context, 30_000, {
    HOME: home,
    USERPROFILE: home,
  });
  assert.match(
    harness.client.getInstructions()!,
    /configured Kaiten user_id 42/,
  );
  assert.match(harness.client.getInstructions()!, /owner_ids/);
  assert.equal(harness.requests.length, 0);
});

test('invalid context stops startup with clean stdout and a sanitized diagnostic', async context => {
  const secret = 'fixture-private-context-content';
  const path = contextFile(context, `{"instructions":"${secret}","user_id":0}`);
  for (const file of [path, `${path}.missing`]) {
    const child = spawn(process.execPath, [cliPath], {
      env: {
        ...process.env,
        KAITEN_ORIGIN: 'https://example.kaiten.ru',
        KAITEN_TOKEN: secret,
        KAITEN_CONTEXT_FILE: file,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    context.after(() => {
      if (child.exitCode === null) child.kill();
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => {
      stdout += String(chunk);
    });
    child.stderr.on('data', chunk => {
      stderr += String(chunk);
    });
    const [code] = await once(child, 'close', {
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(code, 1);
    assert.equal(stdout, '');
    assert.match(stderr, /KAITEN_CONTEXT_FILE/);
    assert.ok(!stderr.includes(secret));
    assert.ok(!stderr.includes(path));
  }
});
