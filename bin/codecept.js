#!/usr/bin/env node
import { Command } from 'commander';
import { version } from '../lib/codecept.js';
import * as outputLib from '../lib/output.js';
import { printError } from '../lib/command/utils.js';
import * as init from '../lib/command/init.js';
import * as configMigrate from '../lib/command/configMigrate.js';
import * as interactive from '../lib/command/interactive.js';
import * as definitions from '../lib/command/definitions.js';
import * as list from '../lib/command/list.js';
import * as gherkinInit from '../lib/command/gherkin/init.js';
import * as gherkinSteps from '../lib/command/gherkin/steps.js';
import * as gherkinSnippets from '../lib/command/gherkin/snippets.js';
import * as generate from '../lib/command/generate.js';
import * as run from '../lib/command/run.js';
import * as runWorkers from '../lib/command/run-workers.js';
import * as runMultiple from '../lib/command/run-multiple.js';
import { runRerun } from '../lib/command/run-rerun.js';
import * as dryRun from '../lib/command/dryRun.js';
import * as info from '../lib/command/info.js';
import { heal } from "../lib/command/generate.js";

const program = new Command();

const commandFlags = {
  ai: {
    flag: '--ai',
    description: 'enable AI assistant',
  },
  verbose: {
    flag: '--verbose',
    description: 'output internal logging information',
  },
  debug: {
    flag: '--debug',
    description: 'output additional information',
  },
  config: {
    flag: '-c, --config [file]',
    description: 'configuration file to be used',
  },
  profile: {
    flag: '--profile [value]',
    description: 'configuration profile to be used',
  },
  steps: {
    flag: '--steps',
    description: 'show step-by-step execution',
  },
};

const errorHandler = (fn) => async (...args) => {
  try {
    await fn.default(...args);
  } catch (e) {
    printError(e);
    process.exitCode = 1;
  }
};

if (process.versions.node && process.versions.node.split('.') && process.versions.node.split('.')[0] < 12) {
  outputLib.output.output.error('NodeJS >= 12 is required to run.');
  outputLib.print();
  outputLib.print('Please upgrade your NodeJS engine');
  outputLib.print(`Current NodeJS version: ${process.version}`);
  process.exit(1);
}

program.usage('<command> [options]');
program.version(version());

program.command('init [path]')
  .description('Creates dummy config in current dir or [path]')
  .action(errorHandler(init));

program.command('migrate [path]')
  .description('Migrate json config to js config in current dir or [path]')
  .action(errorHandler(configMigrate));

program.command('shell [path]')
  .alias('sh')
  .description('Interactive shell')
  .option(commandFlags.verbose.flag, commandFlags.verbose.description)
  .option(commandFlags.profile.flag, commandFlags.profile.description)
  .option(commandFlags.ai.flag, commandFlags.ai.description)
  .option(commandFlags.config.flag, commandFlags.config.description)
  .action(errorHandler(interactive));

program.command('list [path]')
  .alias('l')
  .description('List all actions for I.')
  .action(errorHandler(list));

program.command('def [path]')
  .description('Generates TypeScript definitions for all I actions.')
  .option(commandFlags.config.flag, commandFlags.config.description)
  .option('-o, --output [folder]', 'target folder to paste definitions')
  .action(errorHandler(definitions));

program.command('gherkin:init [path]')
  .alias('bdd:init')
  .description('Prepare CodeceptJS to run feature files.')
  .option(commandFlags.config.flag, commandFlags.config.description)
  .action(errorHandler(gherkinInit));

program.command('gherkin:steps [path]')
  .alias('bdd:steps')
  .description('Prints all defined gherkin steps.')
  .option(commandFlags.config.flag, commandFlags.config.description)
  .action(errorHandler(gherkinSteps));

program.command('gherkin:snippets [path]')
  .alias('bdd:snippets')
  .description('Generate step definitions from steps.')
  .option('--dry-run', "don't save snippets to file")
  .option(commandFlags.config.flag, commandFlags.config.description)
  .option('--feature [file]', 'feature files(s) to scan')
  .option('--path [file]', 'file in which to place the new snippets')
  .action(errorHandler(gherkinSnippets));

program.command('generate:test [path]')
  .alias('gt')
  .description('Generates an empty test')
  .action(errorHandler(generate.test));

program.command('generate:pageobject [path]')
  .alias('gpo')
  .description('Generates an empty page object')
  .action(errorHandler(generate.pageObject));

program.command('generate:object [path]')
  .alias('go')
  .option('--type, -t [kind]', 'type of object to be created')
  .description('Generates an empty support object (page/step/fragment)')
  .action(errorHandler(generate.pageObject));

program.command('generate:helper [path]')
  .alias('gh')
  .description('Generates a new helper')
  .action(errorHandler(generate.helper));

program.command('generate:heal [path]')
  .alias('gr')
  .description('Generates basic heal recipes')
  .action(errorHandler(heal));

program.command('run [test]')
  .description('Executes tests')

  // codecept-only options
  .option(commandFlags.ai.flag, commandFlags.ai.description)
  .option(commandFlags.steps.flag, commandFlags.steps.description)
  .option(commandFlags.debug.flag, commandFlags.debug.description)
  .option(commandFlags.verbose.flag, commandFlags.verbose.description)
  .option('-o, --override [value]', 'override current config options')
  .option(commandFlags.profile.flag, commandFlags.profile.description)
  .option(commandFlags.config.flag, commandFlags.config.description)
  .option('--features', 'run only *.feature files and skip tests')
  .option('--tests', 'run only JS test files and skip features')
  .option('--no-timeouts', 'disable all timeouts')
  .option('-p, --plugins <k=v,k2=v2,...>', 'enable plugins, comma-separated')

  // mocha options
  .option('--colors', 'force enabling of colors')
  .option('--no-colors', 'force disabling of colors')
  .option('-G, --growl', 'enable growl notification support')
  .option('-O, --reporter-options <k=v,k2=v2,...>', 'reporter-specific options')
  .option('-R, --reporter <name>', 'specify the reporter to use')
  .option('-S, --sort', 'sort test files')
  .option('-b, --bail', 'bail after first test failure')
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
  .option('--child <string>', 'option for child processes')
  .action(errorHandler(run));

program.command('run-workers <workers> [selectedRuns...]')
  .description('Executes tests in workers')
  .option(commandFlags.config.flag, commandFlags.config.description)
  .option('-g, --grep <pattern>', 'only run tests matching <pattern>')
  .option('-i, --invert', 'inverts --grep matches')
  .option('-o, --override [value]', 'override current config options')
  .option('--suites', 'parallel execution of suites not single tests')
  .option(commandFlags.debug.flag, commandFlags.debug.description)
  .option(commandFlags.verbose.flag, commandFlags.verbose.description)
  .option('--features', 'run only *.feature files and skip tests')
  .option('--tests', 'run only JS test files and skip features')
  .option(commandFlags.profile.flag, commandFlags.profile.description)
  .option(commandFlags.ai.flag, commandFlags.ai.description)
  .option('-p, --plugins <k=v,k2=v2,...>', 'enable plugins, comma-separated')
  .option('-O, --reporter-options <k=v,k2=v2,...>', 'reporter-specific options')
  .option('-R, --reporter <name>', 'specify the reporter to use')
  .action(errorHandler(runWorkers));

program.command('run-multiple [suites...]')
  .description('Executes tests multiple')
  .option(commandFlags.config.flag, commandFlags.config.description)
  .option(commandFlags.profile.flag, commandFlags.profile.description)
  .option('--all', 'run all suites')
  .option('--features', 'run only *.feature files and skip tests')
  .option('--tests', 'run only JS test files and skip features')
  .option(commandFlags.ai.flag, commandFlags.ai.description)
  .option('-g, --grep <pattern>', 'only run tests matching <pattern>')
  .option('-f, --fgrep <string>', 'only run tests containing <string>')
  .option('-i, --invert', 'inverts --grep and --fgrep matches')
  .option(commandFlags.steps.flag, commandFlags.steps.description)
  .option(commandFlags.verbose.flag, commandFlags.verbose.description)
  .option(commandFlags.debug.flag, commandFlags.debug.description)
  .option('-p, --plugins <k=v,k2=v2,...>', 'enable plugins, comma-separated')
  .option('-o, --override [value]', 'override current config options')
  .option('-O, --reporter-options <k=v,k2=v2,...>', 'reporter-specific options')
  .option('-R, --reporter <name>', 'specify the reporter to use')
  .option('--recursive', 'include sub directories')

  // mocha options
  .option('--colors', 'force enabling of colors')

  .action(errorHandler(runMultiple));

program.command('info [path]')
  .description('Print debugging information concerning the local environment')
  .option('-c, --config', 'your config file path')
  .action(errorHandler(info));

program.command('dry-run [test]')
  .description('Prints step-by-step scenario for a test without actually running it')
  .option('-p, --plugins <k=v,k2=v2,...>', 'enable plugins, comma-separated')
  .option('--bootstrap', 'enable bootstrap & teardown scripts for dry-run')
  .option(commandFlags.config.flag, commandFlags.config.description)
  .option('--all', 'run all suites')
  .option('--features', 'run only *.feature files and skip tests')
  .option('--tests', 'run only JS test files and skip features')
  .option('-g, --grep <pattern>', 'only run tests matching <pattern>')
  .option('-f, --fgrep <string>', 'only run tests containing <string>')
  .option('-i, --invert', 'inverts --grep and --fgrep matches')
  .option(commandFlags.steps.flag, commandFlags.steps.description)
  .option(commandFlags.verbose.flag, commandFlags.verbose.description)
  .option(commandFlags.debug.flag, commandFlags.debug.description)
  .action(errorHandler(dryRun));

program.command('run-rerun [test]')
  .description('Executes tests in more than one test suite run')

  // codecept-only options
  .option(commandFlags.steps.flag, commandFlags.steps.description)
  .option(commandFlags.debug.flag, commandFlags.debug.description)
  .option(commandFlags.verbose.flag, commandFlags.verbose.description)
  .option('-o, --override [value]', 'override current config options')
  .option(commandFlags.profile.flag, commandFlags.profile.description)
  .option(commandFlags.config.flag, commandFlags.config.description)
  .option('--features', 'run only *.feature files and skip tests')
  .option('--tests', 'run only JS test files and skip features')
  .option('-p, --plugins <k=v,k2=v2,...>', 'enable plugins, comma-separated')

  // mocha options
  .option('--colors', 'force enabling of colors')
  .option('--no-colors', 'force disabling of colors')
  .option('-G, --growl', 'enable growl notification support')
  .option('-O, --reporter-options <k=v,k2=v2,...>', 'reporter-specific options')
  .option('-R, --reporter <name>', 'specify the reporter to use')
  .option('-S, --sort', 'sort test files')
  .option('-b, --bail', 'bail after first test failure')
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
  .option('--child <string>', 'option for child processes')

  .action(runRerun);

program.on('command:*', (cmd) => {
  console.log(`\nUnknown command ${cmd}\n`);
  program.outputHelp();
});

if (process.argv.length <= 2) {
  program.outputHelp();
} else {
  program.parse(process.argv);
}
