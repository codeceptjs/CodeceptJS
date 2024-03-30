import { getConfig, getTestRoot } from './utils.js';
import Config from '../config.js';
import Codecept from '../codecept.js';
import * as output from '../output.js';
import * as event from '../event.js';
import { store } from '../store.js';
import Container from '../container.js';

export default async function (test, options) {
  if (options.grep) process.env.grep = options.grep.toLowerCase();
  const configFile = options.config;
  let codecept;

  const testRoot = getTestRoot(configFile);
  let config = getConfig(configFile);
  if (options.override) {
    config = Config.append(JSON.parse(options.override));
  }

  if (config.plugins) {
    // disable all plugins by default, they can be enabled with -p option
    for (const plugin in config.plugins) {
      // if `-p all` is passed, then enabling all plugins, otherwise plugins could be enabled by `-p customLocator,commentStep,tryTo`
      config.plugins[plugin].enabled = options.plugins === 'all';
    }
  }

  try {
    codecept = new Codecept(config, options);
    codecept.init(testRoot);

    if (options.bootstrap) await codecept.bootstrap();

    codecept.loadTests();
    store.dryRun = true;

    if (!options.steps && !options.verbose && !options.debug) {
      printTests(codecept.testFiles);
      return;
    }
    event.dispatcher.on(event.all.result, printFooter);
    codecept.run(test);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

function printTests(files) {
  const figures = require('figures');
  const colors = require('chalk');

  output.print(output.output.styles.debug(`Tests from ${global.codecept_dir}:`));
  output.print();

  const mocha = Container.mocha();
  mocha.files = files;
  mocha.loadFiles();

  let numOfTests = 0;
  let numOfSuites = 0;
  let outputString = '';
  const filterBy = process.env.grep ? process.env.grep.toLowerCase() : undefined;

  if (filterBy) {
    for (const suite of mocha.suite.suites) {
      const currentSuite = suite.title;
      if (suite.title.toLowerCase().includes(filterBy)) {
        outputString += `${colors.white.bold(suite.title)} -- ${output.styles.log(suite.file || '')} -- ${mocha.suite.suites.length} tests\n`;
        numOfSuites++;
      }

      for (test of suite.tests) {
        if (test.title.toLowerCase().includes(filterBy)) {
          numOfTests++;
          outputString += `${colors.white.bold(test.parent.title)} -- ${output.styles.log(test.parent.file || '')} -- ${mocha.suite.suites.length} tests\n`;
          outputString += `  ${output.styles.scenario(figures.checkboxOff)} ${test.title}\n`;
        }
      }
    }
    numOfSuites = countSuites(outputString);
  } else {
    for (const suite of mocha.suite.suites) {
      output.print(`${colors.white.bold(suite.title)} -- ${output.styles.log(suite.file || '')} -- ${mocha.suite.suites.length} tests`);
      numOfSuites++;

      for (test of suite.tests) {
        numOfTests++;
        output.print(`  ${output.styles.scenario(figures.checkboxOff)} ${test.title}`);
      }
    }
  }

  output.print(removeDuplicates(outputString));
  output.print('');
  output.success(`  Total: ${numOfSuites} suites | ${numOfTests} tests  `);
  printFooter();
  process.exit(0);
}

function printFooter() {
  output.print();
  output.print('--- DRY MODE: No tests were executed ---');
}

function removeDuplicates(inputString) {
  const array = inputString.split('\n');
  const uniqueLines = [...new Set(array)];
  const resultString = uniqueLines.join('\n');

  return resultString;
}

function countSuites(inputString) {
  const array = inputString.split('\n');

  const uniqueLines = [...new Set(array)];
  const res = uniqueLines.filter(item => item.includes('-- '));
  return res.length;
}
