# Advanced Usage

## Data Driven Tests

Execute the same scenario on a different data set.

Let's say you want to test login for different user accounts.
In this case, you need to create a datatable and fill it in with credentials.
Then use `Data().Scenario` to include this data and generate multiple scenarios:

```js
// Define data table inside a test or load from another module
let accounts = new DataTable(['login', 'password']); //
accounts.add(['davert', '123456']); // adding records to a table
accounts.add(['admin', '123456']);

// You can skip some data. But add them to report as skipped (just like with usual scenarios):
accounts.xadd(['admin', '23456'])

// Pass dataTable to Data()
// Use special param `current` to get current data set
Data(accounts).Scenario('Test Login', (I, current) => {
  I.fillField('Username', current.login); // current is reserved!
  I.fillField('Password', current.password);
  I.click('Sign In');
  I.see('Welcome '+ current.login);
});


// Also you can set only for Data tests. It will launch executes only the current test but with all data options
Data(accounts).only.Scenario('Test Login', (I, current) => {
  I.fillField('Username', current.login); // current is reserved!
  I.fillField('Password', current.password);
  I.click('Sign In');
  I.see('Welcome '+ current.login);
});
```

*Important: you can't use name `current` for pageObjects or helpers in data scenarios*

This will produce 2 tests with different data sets.
Current data set is appended to a test name in output:

```sh
✓ Test Login | {"login":"davert","password":"123456"}
✓ Test Login | {"login":"admin","password":"123456"}
S Test Login | {"login":"admin","password":"23456"}
```

```js
// You can filter your data table
Data(accounts.filter(account => account.login == 'admin')
.Scenario('Test Login', (I, current) => {
  I.fillField('Username', current.login);
  I.fillField('Password', current.password);
  I.click('Sign In');
  I.see('Welcome '+ current.login);
});
```

This will limit data sets accoring passed function:

```sh
✓ Test Login | {"login":"admin","password":"123456"}
S Test Login | {"login":"admin","password":"23456"}
```

Data sets can also be defined with array, generator, or a function.

```js
Data(function*() {
  yield { user: 'davert'};
  yield { user: 'andrey'};
}).Scenario() // ...
```

*HINT: If you don't use DataTable. add `toString()` method to each object added to data set, so the data could be pretty printed in a test name*

## Groups

Append `@tag` to your test name, so
all tests with `@tag` could be executed with `--grep @tag` option.

```js
Scenario('update user profile @slow')
```

```sh
codeceptjs run --grep @slow
```

Use regex for more flexible filtering:

* `--grep '(?=.*@smoke2)(?=.*@smoke3)'` - run tests with @smoke2 and @smoke3 in name
* `--grep '@smoke2|@smoke3'` - run tests with @smoke2 or @smoke3 in name
* `--grep '((?=.*@smoke2)(?=.*@smoke3))|@smoke4'` - run tests with (@smoke2 and @smoke3) or @smoke4 in name
* `--grep '(?=.*@smoke2)^(?!.*@smoke3)'` - run tests with @smoke2 but without @smoke3 in name
* `--grep '(?=.*)^(?!.*@smoke4)'` - run all tests except @smoke4

## Debug

CodeceptJS provides a debug mode in which additional information is printed.
It can be turned on with `--debug` flag.

```sh
codeceptjs run --debug
```

to receive even more information turn on `--verbose` flag:

```sh
codeceptjs run --verbose
```

And don't forget that you can pause execution and enter **interactive console** mode by calling `pause()` inside your test.

For advanced debugging use NodeJS debugger. In WebStorm IDE:

```sh
node $NODE_DEBUG_OPTION ./node_modules/.bin/codeceptjs run
```

## Parallel Execution

CodeceptJS can be configured to run tests in parallel.

When enabled, it collects all test files and executes them in parallel by the specified amount of chunks. Given we have five test scenarios (`a_test.js`,`b_test.js`,`c_test.js`,`d_test.js` and `e_test.js`), by setting `"chunks": 2` we tell the runner to run two suites in parallel. The first suite will run `a_test.js`,`b_test.js` and `c_test.js`, the second suite will run `d_test.js` and `e_test.js`.


```js
"multiple": {
  "parallel": {
    // Splits tests into 2 chunks
    "chunks": 2
  }
}
```

To execute them use `run-multiple` command passing configured suite, which is `parallel` in this example:

```
codeceptjs run-multiple parallel
```

Grep and multiple browsers are supported. Passing more than one browser will multiply the amount of suites by the amount of browsers passed. The following example will lead to four parallel runs.

```js
"multiple": {
  // 2x chunks + 2x browsers = 4
  "parallel": {
    // Splits tests into chunks
    "chunks": 2,
    // run all tests in chrome and firefox
    "browsers": ["chrome", "firefox"]
  },
}
```

Passing a function will enable you to provide your own chunking algorithm. The first argument passed to you function is an array of all test files, if you enabled grep the test files passed are already filtered to match the grep pattern.

```js
"multiple": {
  "parallel": {
    // Splits tests into chunks by passing an anonymous function,
    // only execute first and last found test file
    "chunks": (files) => {
      return [
        [ files[0] ], // chunk 1
        [ files[files.length-1] ], // chunk 2
      ]
    },
    // run all tests in chrome and firefox
    "browsers": ["chrome", "firefox"]
  },
}
```

Note: Chunking will be most effective if you have many individual test files that contain only a small amount of scenarios. Otherwise the combined execution time of many scenarios or big scenarios in one single test file potentially lead to an uneven execution time.


## Multiple Browsers Execution


This is useful if you want to execute same tests but on different browsers and with different configurations or different tests on same browsers in parallel.

```js
"multiple": {
  "basic": {
    // run all tests in chrome and firefox
    "browsers": ["chrome", "firefox"]
  },

  "smoke": {
    // run only tests containing "@smoke" in name
    "grep": "@smoke",

    // store results into `output/smoke` directory
    "outputName": "smoke",

    // use firefox and different chrome configurations
    "browsers": [
      "firefox",
      {"browser": "chrome", "windowSize": "maximize"},
      // replace any config values from WebDriverIO helper
      {"browser": "chrome", "windowSize": "1200x840"}
    ]
  },

  "parallel": {
    // Splits tests into chunks
    "chunks": 2,
    // run all tests in chrome
    "browsers": ["chrome"]
  },

}
```

Then tests can be executed using `run-multiple` command.

Run all suites for all browsers:

```sh
codeceptjs run-multiple --all
```

Run `basic` suite for all browsers

```sh
codeceptjs run-multiple basic
```

Run `basic` suite for chrome only:

```sh
codeceptjs run-multiple basic:chrome
```

Run `basic` suite for chrome and `smoke` for firefox

```sh
codeceptjs run-multiple basic:chrome smoke:firefox
```

Run basic tests with grep and junit reporter

```sh
codeceptjs run-multiple basic --grep signin --reporter mocha-junit-reporter
```

Run regression tests specifying different config path:

```sh
codeceptjs run-multiple regression -c path/to/config
```

Each executed process uses custom folder for reports and output. It is stored in subfolder inside an output directory. Subfolders will be named in `suite_browser` format.

Output is printed for all running processes. Each line is tagged with a suite and browser name:

```sh
[basic:firefox] GitHub --
[basic:chrome] GitHub --
[basic:chrome]    it should not enter
[basic:chrome]  ✓ signin in 2869ms

[basic:chrome]   OK  | 1 passed   // 30s
[basic:firefox]    it should not enter
[basic:firefox]  ✖ signin in 2743ms

[basic:firefox] -- FAILURES:
```

### Hooks

Hooks are available when using the `run-multiple` command to perform actions before the test suites start and after the test suites have finished. See [Hooks](http://codecept.io/hooks/#bootstrap-teardown) for an example.

## Dynamic Configuration

Helpers can be reconfigured per scenario or per feature.
This might be useful when some tests should be executed with different settings than others.
In order to reconfigure tests use `.config()` method of `Scenario` or `Feature`.

```js
Scenario('should be executed in firefox', (I) => {
  // I.amOnPage(..)
}).config({ browser: 'firefox' })
```

In this case `config` overrides current config of the first helper.
To change config of specific helper pass two arguments: helper name and config values:

```js
Scenario('should create data via v2 version of API', (I) => {
  // I.amOnPage(..)
}).config('REST', { endpoint: 'https://api.mysite.com/v2' })
```

Config can also be set by a function, in this case you can get a test object and specify config values based on it.
This is very useful when running tests against cloud providers, like BrowserStack.

```js
Scenario('should report to BrowserStack', (I) => {
  // I.amOnPage(..)
}).config((test) => {
  return { desiredCapabilities: {
    project: test.suite.title,
    name: test.title,
  }}
});
```

Config changes can be applied to all tests in suite:

```js
Feature('Admin Panel').config({ url: 'https://mysite.com/admin' });
```

Please note that some config changes can't be applied on the fly. For instance, if you set `restart: false` in your config and then changing value `browser` won't take an effect as browser is already started and won't be closed untill all tests finish.

Configuration changes will be reverted after a test or a suite.

## done()
