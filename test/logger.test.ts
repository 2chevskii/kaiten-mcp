import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {test} from 'node:test';

test('all enabled log levels write JSON exclusively to stderr', () => {
  const loggerUrl = new URL('../bin/logger.js', import.meta.url);
  const script = `
    import {logger} from ${JSON.stringify(loggerUrl.href)};
    logger.debug('suppressed');
    logger.info('default level');
    logger.level = 'trace';
    for (const level of ['trace', 'debug', 'info', 'warn', 'error', 'fatal']) {
      logger[level]({operation: 'fixture'}, level);
    }
  `;
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', script],
    {
      cwd: tmpdir(),
      encoding: 'utf8',
      timeout: 5000,
    },
  );

  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  const entries = result.stderr
    .trim()
    .split('\n')
    .map(line => JSON.parse(line) as Record<string, unknown>);
  assert.deepEqual(
    entries.map(entry => entry.level),
    [30, 10, 20, 30, 40, 50, 60],
  );
  assert.deepEqual(
    entries.map(entry => entry.msg),
    ['default level', 'trace', 'debug', 'info', 'warn', 'error', 'fatal'],
  );
  for (const entry of entries) {
    assert.equal(entry.name, 'kaiten-mcp');
    assert.equal(typeof entry.time, 'number');
  }
  for (const entry of entries.slice(1)) {
    assert.equal(entry.operation, 'fixture');
  }
});
