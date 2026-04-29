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

## Plugin Arguments

`run`, `run-workers`, `run-multiple`, `run-rerun` and `dry-run` accept a `-p` (`--plugins`) flag to enable plugins on the command line, with optional arguments per plugin. Tokens are colon-chained per plugin, comma-separated across plugins:

```sh
npx codeceptjs run -p <name>                       # enable plugin
npx codeceptjs run -p <name>:<arg1>:<arg2>         # enable + pass args
npx codeceptjs run -p <plugin1>,<plugin2>:<arg>    # multiple plugins
```

Plugins listed via `-p` are activated even when their config has `enabled: false` (or no `enabled` flag). This is the supported way to switch a plugin on for a single run without editing `codecept.conf`.

A few examples:

```sh
npx codeceptjs run -p pause                              # pause on first failure (default on=fail)
npx codeceptjs run -p pause:on=step                      # pause before every step
npx codeceptjs run -p pause:on=url:pattern=/checkout/*   # pause on URL match
npx codeceptjs run -p "screenshot:on=step;slides=true"   # produce a step-by-step HTML report
```

### Browser Control

The built-in `browser` plugin overrides browser-helper config from the CLI — works for Playwright, Puppeteer, WebDriver and Appium without editing `codecept.conf`.

```sh
npx codeceptjs run -p browser:show                       # force visible browser
npx codeceptjs run -p browser:hide                       # force headless
npx codeceptjs run -p browser:browser=firefox            # switch engine
npx codeceptjs run -p browser:windowSize=1024x768        # set viewport
npx codeceptjs run -p browser:hide:browser=webkit:windowSize=800x600
```

Tokens after `browser:` are either flags (`show`, `hide`) or `key=value` pairs. Three keys get per-helper translation:

- `browser=<name>` — Puppeteer receives `product`, Playwright/WebDriver receive `browser`. Validated per helper (`chromium`/`webkit`/`firefox` for Playwright, `chrome`/`firefox` for Puppeteer).
- `show=true|false` (or the `show`/`hide` flag) — sets `show` on Playwright/Puppeteer; injects/strips `--headless` in WebDriver chrome/firefox capability args.
- `windowSize=WxH` — sets `windowSize` on every helper; also adds `--window-size=W,H` to chromium/chrome args for Playwright/Puppeteer.

Anything else (`-p browser:video=false:waitForTimeout=10000`) is shallow-merged onto every browser helper present in config. Values are coerced (`true`/`false` → boolean, digits → Number, otherwise string).

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

Prints all available methods of `I` to console.

```sh
npx codeceptjs list
```

Use `-c` to point at a specific config (same as `run`):

```sh
npx codeceptjs list -c ./test/acceptance/codecept.Playwright.js
```

Add `--docs` to print full documentation (description, examples, `@param` annotations) below each action — pulled from helper JSDoc and `docs/webapi/*` snippets:

```sh
npx codeceptjs list --docs
```

Use `--action` to show docs for a single action. The `I.` prefix is optional and `--docs` is implied:

```sh
npx codeceptjs list --action amOnPage
npx codeceptjs list --action I.click -c ./test/acceptance/codecept.Playwright.js
```

## Local Environment Information

Prints debugging information concerning the local environment

```sh
npx codeceptjs info
```
