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

Run test files in shuffled order

```sh
npx codeceptjs run --shuffle
```

Run single test in debug mode (see more in [debugging](#Debugging) section)

```sh
npx codeceptjs run github_test.js --debug
```

Select config file manually (`-c` or `--config` option)

```sh
npx codeceptjs run -c my.codecept.conf.js
npx codeceptjs run --config path/to/codecept.conf.js
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

#### Debugging 

Run single test in debug mode

```sh
npx codeceptjs run --debug
```

Run test with internal logs printed.

```sh
npx codeceptjs run --verbose
```

Display complete debug output including scheduled promises

```
DEBUG=codeceptjs:* npx codeceptjs run
```

## Run Workers

Run tests in parallel threads. CodeceptJS supports different distribution strategies for optimal performance.

```bash
# Run with 3 workers using default strategy (pre-assign tests)
npx codeceptjs run-workers 3

# Run with pool mode for dynamic test distribution (recommended)
npx codeceptjs run-workers 3 --by pool

# Run with suite distribution
npx codeceptjs run-workers 3 --by suite

# Pool mode with filtering
npx codeceptjs run-workers 4 --by pool --grep "@smoke"
```

**Test Distribution Strategies:**

- `--by test` (default): Pre-assigns individual tests to workers
- `--by suite`: Pre-assigns entire test suites to workers  
- `--by pool`: Dynamic distribution for optimal load balancing (recommended for best performance)

The pool mode provides the best load balancing by maintaining tests in a shared pool and distributing them dynamically as workers become available. This prevents workers from sitting idle and ensures optimal CPU utilization, especially when tests have varying execution times.

See [Parallel Execution](/parallel) documentation for more details.

## Run Rerun <Badge text="Since 3.3.6" type="warning"/>

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

If some plugins need to be enabled in `dry-run` mode, pass its name in `-p` option:

```
npx codeceptjs dry-run --steps -p allure,customLocator
```

If all plugins need to be enabled in `dry-run` mode, pass its name in `-p` option:

```
npx codeceptjs dry-run --steps -p all
```

To enable bootstrap script in dry-run mode, pass in `--bootstrap` option when running with `--steps` or `--debug`

```
npx codeceptjs dry-run --steps --bootstrap
```

## Run Multiple

> ⚠️ prefer using run-workers instead

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
npx codeceptjs def --config path/to/codecept.conf.js
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
