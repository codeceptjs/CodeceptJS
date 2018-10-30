# Commands

## Run

Executes tests. Requires `codecept.json` config to be present in provided path.

---

Run all tests from current dir

```sh
codeceptjs run
```

Load config and run tests from `test` dir

```sh
codeceptjs run -c test
```

Run only tests with "signin" word in name

```sh
codeceptjs run --grep "signin"
```

Run all tests without "@IEOnly" word in name

```sh
codeceptjs run --grep "@IEOnly" --invert
```

Run single test [path to codecept.js] [test filename]

```sh
codeceptjs run github_test.js
```

Run single test with steps printed

```sh
codeceptjs run github_test.js --steps
```

Run single test in debug mode

```sh
codeceptjs run github_test.js --debug
```

Run test with internal logs printed (global promises, and events).

```sh
codeceptjs run github_test.js --verbose
```

Select config file manually (`-c` or `--config` option)

```sh
codeceptjs run -c my.codecept.conf.js
codeceptjs run --config path/to/codecept.json
```

Override config on the fly. Provide valid JSON which will be merged into current config:

```sh
codeceptjs run --override '{ "helpers": {"WebDriverIO": {"browser": "chrome"}}}'
```

Run tests and produce xunit report:

```sh
codeceptjs run --reporter xunit
```

Use any of [Mocha reporters](https://github.com/mochajs/mocha/tree/master/lib/reporters) used.

## Run multiple

Run multiple suites.

```sh
codeceptjs run-multiple smoke:chrome regression:firefox
```

## Init

Creates `codecept.json` file in current directory:

```sh
codeceptjs init
```

Or in provided path

```sh
codecept init test
```

## Shell

Interactive shell. Allows to try `I.` commands in runtime

```sh
codeceptjs shell
```

## Generators

Create new test

```sh
codeceptjs generate test
```

Create new pageobject

```sh
codeceptjs generate pageobject
```

Create new helper

```sh
codeceptjs generate helper
```

## TypeScript Definitions

TypeScript Definitions allows IDEs to provide autocompletion when writing tests.

```sh
codeceptjs def
codeceptjs def --config path/to/codecept.json
```

Produces `steps.d.ts` file, which referenced in the very beginning of a test file.

```js
/// <reference path="./steps.d.ts" />
Feature('My new test');
```

After doing that IDE should provide autocompletion for `I` object inside `Scenario` and `within` blocks.

## List Commands

Prints all available methods of `I` to console

```sh
codeceptjs list
```

## Codecept options

### -r, --require <module-name>

Requires described module before run. This option is useful for assertion libraries, so you may `--require should` instead of manually invoking `require('should')` within each test file. It can be used with relative paths, e.g. `--require ./lib/somemodule.js`, and installed packages.

```sh
// register ts-node, so you can use Typescript in tests with ts-node package
codeceptjs --require ts-node/register run
```
