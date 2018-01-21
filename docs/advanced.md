# Advanced Usage

## Data Driven Tests

Execute the same scenario on a different data set.

Let's say you want to test login for different user accounts.
In this case, you need to create a datatable and fill it in with credentials.
Then use `Data().Scenario` to include this data and generate multiple scenarios:

```js
// define data table inside a test or load from another module
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

* `--grep (?=.*@smoke2)(?=.*@smoke3)` - run tests with @smoke2 and @smoke3 in name
* `--grep @smoke2|@smoke3` - run tests with @smoke2 or @smoke3 in name
* `--grep ((?=.*@smoke2)(?=.*@smoke3))|@smoke4` - run tests with (@smoke2 and @smoke3) or @smoke4 in name
* `--grep (?=.*@smoke2)^(?!.*@smoke3)` - run tests with @smoke2 but without @smoke3 in name

## Debug

CodeceptJS provides a debug mode in which additional information is printed.
It can be turned on with `--debug` flag.

```sh
codeceptjs run --debug
```

While running in debug mode you can pause execution and enter interactive console mode by using `pause()` function.

For advanced debugging use NodeJS debugger. In WebStorm IDE:

```sh
node $NODE_DEBUG_OPTION ./node_modules/.bin/codeceptjs run
```

## Multiple Execution

CodeceptJS can execute multiple suites in parallel. This is useful if you want to execute same tests but on different browsers and with different configurations. Before using this feature you need to add `multiple` option to the config:

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
  }
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

## done()
