#!/usr/bin/env node
'use strict';

var program = require('commander');
var path = require('path');
var Config = require('../lib/config');
var Codecept = require('../lib/codecept');
var print = require('../lib/output');
var fileExists = require('../lib/utils').fileExists;
var fs = require('fs');

program.command('init [path]')
  .description('Creates dummy config in current dir or [path]')
  .action(require('../lib/command/init'));

program.command('shell [path]')
  .alias('sh')
  .description('Interative shell')
  .option('--verbose', 'output internal logging information')
  .option('--profile [value]', 'configuration profile to be used')
  .action(require('../lib/command/interactive'));

program.command('list [path]')
  .alias('l')
  .description('List all actions for I.')
  .action(require('../lib/command/list'));

program.command('def [path]')
  .description('List all actions for I.')
  .action(require('../lib/command/definitions'));

program.command('generate:test [path]')
  .alias('gt')
  .description('Generates an empty test')
  .action(require('../lib/command/generate').test);

program.command('generate:pageobject [path]')
  .alias('gpo')
  .description('Generates an empty page object')
  .action(require('../lib/command/generate').pageObject);

program.command('generate:object [path]')
  .alias('go')
  .option('--type, -t [kind]', 'type of object to be created')
  .description('Generates an empty support object (page/step/fragment)')
  .action(require('../lib/command/generate').pageObject);

program.command('generate:helper [path]')
  .alias('gh')
  .description('Generates a new helper')
  .action(require('../lib/command/generate').helper);

program.command('run [suite] [test]')
  .description('Executes tests')

  // codecept-only options
  .option('--steps', 'show step-by-step execution')
  .option('--debug', 'output additional information')
  .option('--verbose', 'output internal logging information')
  .option('-o, --override [value]', 'override current config options')
  .option('--profile [value]', 'configuration profile to be used')
  .option('--config [file]', 'configuration file to be used')

  // mocha options
  .option('-c, --colors', 'force enabling of colors')
  .option('-C, --no-colors', 'force disabling of colors')
  .option('-G, --growl', 'enable growl notification support')
  .option('-O, --reporter-options <k=v,k2=v2,...>', 'reporter-specific options')
  .option('-R, --reporter <name>', 'specify the reporter to use')
  .option('-S, --sort', "sort test files")
  .option('-b, --bail', "bail after first test failure")
  .option('-d, --debug', "enable node's debugger, synonym for node --debug")
  .option('-g, --grep <pattern>', 'only run tests matching <pattern>')
  .option('-f, --fgrep <string>', 'only run tests containing <string>')
  .option('-i, --invert', 'inverts --grep and --fgrep matches')
  .option('--full-trace', 'display the full stack trace')
  .option('--compilers <ext>:<module>,...', 'use the given module(s) to compile files')
  .option('--debug-brk', "enable node's debugger breaking on the first line")
  .option('--inline-diffs', 'display actual/expected differences inline within each string')
  .option('--no-exit', 'require a clean shutdown of the event loop: mocha will not call process.exit')
  .option('--recursive', 'include sub directories')
  .option('--trace', 'trace function calls')

  .action(require('../lib/command/run'));

if (process.argv.length <= 2) {
  console.log('CodeceptJS v' + Codecept.version());
  program.outputHelp();
}
program.parse(process.argv);
