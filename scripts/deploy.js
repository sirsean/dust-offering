import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { productionHostname, targetForBranch } from './deployment-target.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const [operation, explicitBranch, ...extra] = process.argv.slice(2);
if (
  !['--production', '--branch', '--delete-branch'].includes(operation) ||
  extra.length ||
  (operation === '--production' && explicitBranch)
) {
  throw new Error(
    'Usage: deploy.js --production | --branch [name] | --delete-branch [name]',
  );
}

let configPath = resolve(root, 'wrangler.json');
let hostname = productionHostname;
let workerName = 'dust-offering';

if (operation !== '--production') {
  const branch =
    explicitBranch ??
    execFileSync('git', ['branch', '--show-current'], {
      cwd: root,
      encoding: 'utf8',
    }).trim();
  const target = targetForBranch(branch);
  hostname = target.hostname;
  workerName = target.name;
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  config.name = workerName;
  config.assets.directory = resolve(root, 'dist');
  config.routes = [{ pattern: hostname, custom_domain: true }];
  delete config.$schema;
  const generatedDirectory = resolve(root, '.wrangler/deploy');
  await mkdir(generatedDirectory, { recursive: true });
  configPath = resolve(generatedDirectory, `${target.slug}.json`);
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

const deleting = operation === '--delete-branch';
console.log(
  `${deleting ? 'Removing' : 'Deploying'} ${workerName}: https://${hostname}`,
);
const args = deleting
  ? ['delete', '--name', workerName, '--force', '--config', configPath]
  : ['deploy', '--config', configPath];
const result = spawnSync(
  process.execPath,
  [resolve(root, 'node_modules/wrangler/bin/wrangler.js'), ...args],
  {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      WRANGLER_SEND_METRICS: 'false',
      WRANGLER_LOG_PATH: resolve(root, '.wrangler/logs'),
    },
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
