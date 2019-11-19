---
id: configuration
title: Configuration
---


CodeceptJS configuration is set in `codecept.conf.js` file.

After running `codeceptjs init` it should be saved in test root.

Here is an overview of available options with their defaults:

* **tests**: `"./*_test.js"` - pattern to locate tests. Allows to enter [glob pattern](https://github.com/isaacs/node-glob). 
* **grep**: - pattern to filter tests by name
* **include**: `{}` - actors and page objects to be registered in DI container and included in tests. Accepts objects and module `require` paths
* **timeout**: `10000` - default tests timeout
* **output**: `"./output"` - where to store failure screenshots, etc
* **helpers**: `{}` - list of enabled helpers
* **mocha**: `{}` - mocha options, [reporters](http://codecept.io/reports/) can be configured here
* **multiple**: `{}` - multiple options, see [Multiple Execution](http://codecept.io/parallel#multiple-browsers-execution)
* **bootstrap**: `"./bootstrap.js"` - an option to run code _before_ tests are run. See [Hooks](http://codecept.io/hooks/#bootstrap-teardown)).
* **bootstrapAll**: `"./bootstrap.js"` - an option to run code _before_ all test suites are run when using the run-multiple mode. See [Hooks](http://codecept.io/hooks/#bootstrap-teardown)).
* **teardown**: - an option to run code _after_  all test suites are run when using the run-multiple mode. See [Hooks](http://codecept.io/hooks/#bootstrap-teardown).
* **teardownAll**: - an option to run code _after_ tests are run. See [Hooks](http://codecept.io/hooks/#bootstrap-teardown).
* **noGlobals**: `false` - disable registering global variables like `Actor`, `Helper`, `pause`, `within`, `DataTable`
* **hooks**: - include custom listeners to plug into execution workflow. See [Custom Hooks](http://codecept.io/hooks/#custom-hooks)
* **translation**: - [locale](http://codecept.io/translation/) to be used to print s  teps output, as well as used in source code.
* **require**: `[]` - array of module names to be required before codecept starts. See [Require](#require)


## Require

Requires described module before run. This option is useful for assertion libraries, so you may `--require should` instead of manually invoking `require('should')` within each test file. It can be used with relative paths, e.g. `"require": ["/lib/somemodule"]`, and installed packages.

You can register ts-node, so you can use Typescript in tests with ts-node package
```js
exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: '',
  helpers: {},
  include: {},
  bootstrap: false,
  mocha: {},
  // require modules
  require: ["ts-node/register", "should"]
}
```

## Dynamic Configuration

 By default `codecept.json` is used for configuration. You can override its values in runtime by using `--override` or `-o` option in command line, passing valid JSON as a value:

```sh
codeceptjs run -o '{ "helpers": {"WebDriver": {"browser": "firefox"}}}'
```

 You can also switch to JS configuration format for more dynamic options.
 Create `codecept.conf.js` file and make it export `config` property.

 See the config example:

```js
exports.config = {
  helpers: {
    WebDriver: {
      // load variables from the environment and provide defaults
      url: process.env.CODECEPT_URL || 'http://localhost:3000',

      user: process.env.CLOUDSERVICE_USER,
      key: process.env.CLOUDSERVICE_KEY,

      coloredLogs: true,
      waitForTimeout: 10000
    }
  },

  // don't build monolithic configs
  mocha: require('./mocha.conf.js') || {},
  include: {
    I: './src/steps_file.js',
    loginPage: './src/pages/login_page',
    dashboardPage: new DashboardPage()
  }

  // here goes config as it was in codecept.json
  // ....
};
```

(Don't copy-paste this config, it's just demo)

If you prefer to store your configuration files in a different location, or with a different name, you can do that with `--config` or `-c:

```sh
codeceptjs run --config=./path/to/my/config.js
```

## Common Configuration Patterns

[`@codeceptjs/configure` package](https://github.com/codecept-js/configure) contains shared recipes for common configuration patterns. This allows to set meta-configuration, independent from a current helper enabled.

Install it and enable to easily switch to headless/window mode, change window size, etc.

```js
const { setHeadlessWhen, setWindowSize } = require('@codeceptjs/configure');

setHeadlessWhen(process.env.CI);
setWindowSize(1600, 1200);

exports.config = {
  // ...
}
```

## Profile

Using values from `process.profile` you can change the config dynamically.
It provides value of `--profile` option passed to runner.
Use its value to change config value on the fly.

For instance, with the config above we can change browser value using `profile` option

```sh
codeceptjs run --profile firefox
```

```js
exports.config = {
  helpers: {
    WebDriver: {
      url: 'http://localhost:3000',
      // load value from `profile`
      browser: process.profile || 'firefox'

    }
  }
};
```
