import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {tmpdir} from 'node:os';
import {readConfiguration} from '../lib/config.js';
import {cliPath} from './harness.ts';

test('configuration defaults and validation', () => {
  const base = {
    KAITEN_ORIGIN: 'https://example.kaiten.ru',
    KAITEN_TOKEN: ' token ',
  };
  assert.deepEqual(readConfiguration(base), {
    origin: base.KAITEN_ORIGIN,
    token: 'token',
    timeoutMs: 30_000,
  });
  assert.throws(() => readConfiguration({}));
  assert.throws(() => readConfiguration({...base, KAITEN_TOKEN: ' '}));
  for (const value of ['0', '-1', '1.5', 'NaN', '', '2147483648']) {
    assert.throws(() => readConfiguration({...base, KAITEN_TIMEOUT_MS: value}));
  }
});

test('invalid startup configuration exits with clean stdout and safe stderr', async context => {
  for (const origin of [
    '',
    'https://user:secret@example.kaiten.ru/path',
    'http://example.kaiten.ru',
  ]) {
    await context.test(origin || 'missing origin', async () => {
      const child = spawn(process.execPath, [cliPath], {
        cwd: tmpdir(),
        env: {...process.env, KAITEN_ORIGIN: origin, KAITEN_TOKEN: 'secret'},
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
      assert.match(stderr, /KAITEN_ORIGIN/);
      assert.ok(!stderr.includes('secret'));
    });
  }
});
