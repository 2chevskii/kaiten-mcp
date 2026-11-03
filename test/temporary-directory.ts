import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import type {TestContext} from 'node:test';

export function temporaryDirectory(context: TestContext): string {
  const directory = mkdtempSync(join(tmpdir(), 'kaiten-mcp-test-'));
  context.after(() => {
    assert.equal(dirname(directory), resolve(tmpdir()));
    rmSync(directory, {recursive: true, force: true});
  });
  return directory;
}
