# Commands

## Run

Executes tests. Requires `codecept.json` config to be present in provided path.

---

Run all tests from current dir

```
codeceptjs run
```

Load config and run tests from `test` dir

```
codeceptjs run -c test
```

Run only tests with "signin" word in name

```
codeceptjs run --grep "signin"
```

Run single test [path to codecept.js] [test filename]

```
codeceptjs run github_test.js
```

Run single test with steps printed

```
codeceptjs run github_test.js --steps
```

Run single test in debug mode

```
codeceptjs run github_test.js --debug
```

Run test with internal logs printed (global promises, and events).

```
codeceptjs run github_test.js --verbose
```

Select config file manually (`-c` or `--config` option)

```
codeceptjs run -c my.codecept.conf.js
codeceptjs run --config path/to/codecept.json
```

Override config on the fly. Provide valid JSON which will be merged into current config:

```
codeceptjs run --override '{ "helpers": {"WebDriverIO": {"browser": "chrome"}}}'
```

Run tests and produce xunit report:

```
codeceptjs run --reporter xunit
```

Use any of [Mocha reporters](https://github.com/mochajs/mocha/tree/master/lib/reporters) used.


## Run multiple

Run multiple suites.

```
codeceptjs run-multiple smoke:chrome regression:firefox
```

## Init

Creates `codecept.json` file in current directory:

```
codeceptjs init
```

Or in provided path

```
codecept init test
```

## Shell

Interactive shell. Allows to try `I.` commands in runtime

```
codeceptjs shell
```

## Generators

Create new test

```
codeceptjs generate test
```

Create new pageobject

```
codeceptjs generate pageobject
```

Create new helper

```
codeceptjs generate helper
```

## TypeScript Definitions

TypeScript Definitions allows IDEs to provide autocompletion when writing tests.

```
codeceptjs def
```

Produces `steps.d.ts` file, which referenced in the very beginning of a test file.

```js
/// <reference path="./steps.d.ts" />
Feature('My new test');
```

After doing that IDE should provide autocompletion for `I` object inside `Scenario` and `within` blocks.

## List Commands

Prints all avialable methods of `I` to console

```
codeceptjs list
```
