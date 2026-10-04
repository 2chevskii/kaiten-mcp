import {appendFileSync, writeFileSync} from 'node:fs';
import packageJson from '../package.json' with {type: 'json'};

const {PR_NUMBER, COMMIT_SHA, GITHUB_OUTPUT} = process.env;
if (!COMMIT_SHA || !GITHUB_OUTPUT) {
  throw new Error('COMMIT_SHA and GITHUB_OUTPUT are required.');
}

const version = `${packageJson.version}-${PR_NUMBER || 'master'}-${COMMIT_SHA.slice(0, 7)}`;
const packageName = packageJson.name.replace('@', '').replace('/', '-');

writeFileSync(
  new URL('../package.json', import.meta.url),
  `${JSON.stringify({...packageJson, version}, null, 2)}\n`,
);
appendFileSync(GITHUB_OUTPUT, `package_path=${packageName}-${version}.tgz\n`);
console.log(`Package version: ${version}`);
