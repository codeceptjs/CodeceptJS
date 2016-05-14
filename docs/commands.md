# Commands

## Run

Executes tests. Requires `codecept.json` config to be present in provided path.

---

Run all tests from current dir

```
codeceptjs run
```

Run tests from `test` dir

```
codeceptjs run test
```

Run only tests with "signin" word in name

```
codeceptjs run --grep "signin"
```

Run single test [path to codecept.js] [test filename]

```
codeceptjs run . github_test.js
```

Run single test with steps printed

```
codeceptjs run . github_test.js --steps
```

Run single test in debug mode

```
codeceptjs run . github_test.js --debug
```

Run tests and produce xunit report:

```
codeceptjs run --reporter xunit
```

Use any of [Mocha reporters](https://github.com/mochajs/mocha/tree/master/lib/reporters) used.

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

Produces `steps.d.ts` file with TypeScript definitions.
When refrerenced in tests can be used by IDE to provide autocompletion.

```
codeceptjs def
```

## List Commands

Prints all avialable methods of `I` to console

```
codeceptjs list
```