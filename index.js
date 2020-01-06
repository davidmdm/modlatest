#!/usr/bin/env node

'use strict';

const path = require('path');
const fs = require('fs');
const folder = process.argv[2] || '.';

const { spawn } = require('child_process');

const pCmd = (childProcess, errMessage) => {
  return new Promise((resolve, reject) => {
    childProcess
      .on('error', err => console.error(err.message))
      .on('close', exitCode => {
        if (exitCode === 0) {
          resolve();
        } else {
          reject(new Error(errMessage));
        }
      });
  });
};

const readAndParse = filepath => {
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
};

const cwd = path.resolve(folder);

async function main() {
  const pkg = readAndParse(path.join(folder, 'package.json'));

  const dependencies = pkg.dependencies || {};
  const depArgs = Object.keys(dependencies).map(key => key + '@latest');

  console.log('Installing latest dependencies\n');
  await pCmd(spawn('npm', ['i', '-S', ...depArgs], { cwd, stdio: 'inherit' }), 'failed to install latest dependencies');

  const devDependencies = pkg.devDependencies || {};
  const devDepArgs = Object.keys(devDependencies).map(key => key + '@latest');

  console.log('\nInstalling latest development dependencies\n');
  await pCmd(
    spawn('npm', ['i', '-D', ...devDepArgs], { cwd, stdio: 'inherit' }),
    'failed to install latest dev-dependencies'
  );

  console.log('\nRunning audit\n');
  await pCmd(spawn('npm', ['audit'], { cwd, stdio: 'inherit' }), 'failed to run audit');
}

main()
  .then(() => console.log('done'))
  .catch(e => {
    console.error(e.message);
    process.exit(-1);
  });
