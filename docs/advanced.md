---
id: advanced
title: Advanced Usage
---

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

## Tags

Append `@tag` to your test name, so

```js
Scenario('update user profile @slow')
```

Alternativly, use `tag` method of Scenario to set additional tags:

```js
Scenario('update user profile', () => {
  // test goes here
}).tag('@slow').tag('important');
```

All tests with `@tag` could be executed with `--grep @tag` option.

```sh
codeceptjs run --grep @slow
```

Use regex for more flexible filtering:

* `--grep '(?=.*@smoke2)(?=.*@smoke3)'` - run tests with @smoke2 and @smoke3 in name
* `--grep "\@smoke2|\@smoke3"` - run tests with @smoke2 or @smoke3 in name
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

For Visual Studio Code, add the following configuration in launch.json:

```json
{
  "type": "node",
  "request": "launch",
  "name": "codeceptjs",
  "args": ["run", "--grep", "@your_test_tag"],
  "program": "${workspaceFolder}/node_modules/.bin/codeceptjs"
}
```


## Test Options

Features and Scenarios have their options that can be set by passing a hash after their names:

```js
Feature('My feature', {key: val});

Scenario('My scenario', {key: val}, (I) => {});
```

### Timeout

By default there is no timeout for tests, however you can change this value for a specific suite:

```js
Feature('Stop me').timeout(5000); // set timeout to 5s
```

or for the test:

```js
// set timeout to 1s
Scenario("Stop me faster", (I) => {
  // test goes here
}).timeout(1000);

// alternative
Scenario("Stop me faster", {timeout: 1000}, (I) => {});

// disable timeout for this scenario
Scenario("Don't stop me", {timeout: 0}, (I) => {});
```


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
This is very useful when running tests against cloud providers, like BrowserStack. This function can also be asynchronous.

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

