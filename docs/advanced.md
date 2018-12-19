# Advanced Usage

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
