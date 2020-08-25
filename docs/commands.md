---
permalink: /commands
title: Commands
---

# Commands

## Run

Executes tests. Requires `codecept.conf.js` config to be present in provided path.

---

Run all tests from current dir

```sh
npx codeceptjs run
```

Load config and run tests from `test` dir

```sh
npx codeceptjs run -c test
```

Run only tests with "signin" word in name

```sh
npx codeceptjs run --grep "signin"
```

Run all tests without "@IEOnly" word in name

```sh
npx codeceptjs run --grep "@IEOnly" --invert
```

Run single test [path to codecept.js] [test filename]

```sh
npx codeceptjs run github_test.js
```

Run single test with steps printed

```sh
npx codeceptjs run github_test.js --steps
```

Run single test in debug mode

```sh
npx codeceptjs run github_test.js --debug
```

Run test with internal logs printed (global promises, and events).

```sh
npx codeceptjs run github_test.js --verbose
```

Select config file manually (`-c` or `--config` option)

```sh
npx codeceptjs run -c my.codecept.conf.js
npx codeceptjs run --config path/to/codecept.json
```

Override config on the fly. Provide valid JSON which will be merged into current config:

```sh
npx codeceptjs run --override '{ "helpers": {"WebDriver": {"browser": "chrome"}}}'
```

Run tests and produce xunit report:

```sh
npx codeceptjs run --reporter xunit
```

Use any of [Mocha reporters](https://github.com/mochajs/mocha/tree/master/lib/reporters) used.

## Run Workers

Run tests in parallel threads.

```
npx codeceptjs run-workers 3
```

## Run Rerun <Badge text="Since 2.4" type="warning"/>

Run tests multiple times to detect and fix flaky tests.

```
npx codeceptjs run-rerun
```

For this command configuration is required:

```js
{
  // inside codecept.conf.js
  rerun: {
    // how many times all tests should pass
    minSuccess: 2,

    // how many times to try to rerun all tests
    maxReruns: 4,
  }
}
```

Use Cases:

* `minSuccess: 1, maxReruns: 5` - run all tests no more than 5 times, until first successful run.
* `minSuccess: 3, maxReruns: 5` - run all tests no more than 5 times, until reaching 3 successfull runs.
* `minSuccess: 10, maxReruns: 10` - run all tests exactly 10 times, to check their stability.


## Dry Run

Prints test scenarios without executing them

```
npx codeceptjs dry-run
```

When passed `--steps` or `--debug` option runs tests, disabling all plugins and helpers, so you can get step-by-step report with no tests actually executed.

```
npx codeceptjs dry-run --steps
```

If a plugin needs to be enabled in `dry-run` mode, pass its name in `-p` option:

```
npx codeceptjs dry-run --steps -p allure
```

To enable bootstrap script in dry-run mode, pass in `--bootstrap` option when running with `--steps` or `--debug`

```
npx codeceptjs dry-run --steps --bootstrap
```

## Run Multiple

Run multiple suites. Unlike `run-workers` spawns processes to execute tests.
[Requires additional configuration](/advanced#multiple-browsers-execution) and can be used to execute tests in multiple browsers.

```sh
npx codeceptjs run-multiple smoke:chrome regression:firefox
```

## Init

Creates `codecept.conf.js` file in current directory:

```sh
npx codeceptjs init
```

Or in provided path

```sh
npx codecept init test
```

## Migrate

Migrate your current `codecept.json` to `codecept.conf.js`

```sh
npx codeceptjs migrate
```

## Shell

Interactive shell. Allows to try `I.` commands in runtime

```sh
npx codeceptjs shell
```

## Generators

Create new test

```sh
npx codeceptjs generate:test
```

Create new pageobject

```sh
npx codeceptjs generate:pageobject
```

Create new helper

```sh
npx codeceptjs generate:helper
```

## TypeScript Definitions

TypeScript Definitions allows IDEs to provide autocompletion when writing tests.

```sh
npx codeceptjs def
npx codeceptjs def --config path/to/codecept.json
```

After doing that IDE should provide autocompletion for `I` object inside `Scenario` and `within` blocks.

Add optional parameter `output` (or shortcut `-o`), if you want to place your definition file in specific folder:

```sh
npx codeceptjs def --output ./tests/typings
npx codeceptjs def -o ./tests/typings
```

## List Commands

Prints all available methods of `I` to console

```sh
npx codeceptjs list
```

## Local Environment Information

Prints debugging information concerning the local environment

```sh
npx codeceptjs info
```
