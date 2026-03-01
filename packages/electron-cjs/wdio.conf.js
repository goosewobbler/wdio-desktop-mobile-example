const path = require('node:path');
const fs = require('node:fs');

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), { encoding: 'utf-8' }));

globalThis.packageJson = packageJson;

process.env.TEST = 'true';

const config = {
  services: ['electron'],
  capabilities: [
    {
      browserName: 'electron',
      'wdio:electronServiceOptions': {
        appArgs: ['foo', 'bar=baz'],
        restoreMocks: true,
      },
    },
  ],
  waitforTimeout: 5000,
  connectionRetryCount: 10,
  connectionRetryTimeout: 30000,
  logLevel: 'debug',
  runner: 'local',
  outputDir: 'wdio-logs',
  specs: ['./test/*.spec.ts'],
  tsConfigPath: path.join(__dirname, 'tsconfig.json'),
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 30000,
  },
  autoXvfb: true,
};

module.exports = { config };
