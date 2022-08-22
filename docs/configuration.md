---
permalink: /configuration
title: Configuration
---

# Configuration

CodeceptJS configuration is set in `codecept.conf.js` file.

After running `codeceptjs init` it should be saved in test root.

| Name | Type | Description |
| :------ | :------ | :------ |
| `bootstrap` | `Function` \| `boolean` \| `string` | Execute JS code before tests are run. https://codecept.io/bootstrap/ Can be either JS module file or async function:  ```js bootstrap: async () => server.launch(), ``` or ```js bootstrap: 'bootstrap.js', ``` |
| `bootstrapAll` | `Function` \| `boolean` \| `string` | Execute JS code before launching tests in parallel mode.  https://codecept.io/bootstrap/#bootstrapall-teardownall |
| `gherkin?` | { `features`: `string` \| `string`[] ; `steps`: `string`[]  } | Enable BDD features. https://codecept.io/bdd/#configuration   Sample configuration: ```js gherkin: {   features: "./features/*.feature",   steps: ["./step_definitions/steps.js"] } ``` |
| `gherkin.features` | `string` \| `string`[] | load feature files by pattern. Multiple patterns can be specified as array |
| `gherkin.steps` | `string`[] | load step definitions from JS files |
| `grep` | `string` | Pattern to filter tests by name |
| `helpers?` | { `[key: string]`: `any`;  } | Enabled and configured helpers   ```js helpers: {   Playwright: {     url: 'https://mysite.com',     browser: 'firefox'   } } ``` |
| `include?` | `any` | Include page objects to access them via dependency injection  ```js I: "./custom_steps.js", loginPage: "./pages/Login.js", User: "./pages/User.js", ``` Configured modules can be injected by name in a Scenario:  ```js Scenario('test', { I, loginPage, User }) ``` |
| `mocha?` | `any` | [Mocha test runner options](https://mochajs.org/#configuring-mocha-nodejs), additional [reporters](https://codecept.io/reports/#xml) can be configured here.  Example:  ```js mocha: {    "mocha-junit-reporter": {      stdout: "./output/console.log",      options: {        mochaFile: "./output/result.xml",        attachments: true //add screenshot for a failed test      }   } } ``` |
| `noGlobals?` | `boolean` | Disable registering global functions (Before, Scenario, etc). Not recommended |
| `output` | `string` | Where to store failure screenshots, artifacts, etc |
| `plugins?` | `any` | [Enabled plugins](https://codecept.io/plugins/) |
| `require?` | `string`[] | Require additional JS modules. https://codecept.io/configuration/#require   Example: ``` require: ["ts-node/register", "should"] ``` |
| `teardown` | `Function` \| `boolean` \| `string` | Execute JS code after tests are run. https://codecept.io/bootstrap/ Can be either JS module file or async function:  ```js teardown: async () => server.stop(), ``` or ```js teardown: 'teardown.js', ``` |
| `teardownAll` | `Function` \| `boolean` \| `string` | Execute JS code after finishing tests in parallel mode.  https://codecept.io/bootstrap/#bootstrapall-teardownall |
| `tests` | `string` | Pattern to locate CodeceptJS tests.  Allows to enter glob pattern or an Array<string> of patterns to match tests / test file names.   For tests in JavaScript:  ```js tests: 'tests/**.test.js' ```  For tests in TypeScript:  ```js tests: 'tests/**.test.ts' ``` |
| `timeout?` | `number` | Set default tests timeout in seconds.  Tests will be killed on no response after timeout.  ```js timeout: 20, ``` |
| `translation?` | `string` | Enable localized test commands https://codecept.io/translation/ |



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
For array of test pattern
```js
exports.config = {
  tests: ['./*_test.js','./sampleTest.js'],
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

> 📺 [Watch this material](https://www.youtube.com/watch?v=onBnfo_rJa4&t=4s) on YouTube

[`@codeceptjs/configure` package](https://github.com/codeceptjs/configure) contains shared recipes for common configuration patterns. This allows to set meta-configuration, independent from a current helper enabled.

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

Using `process.env.profile` you can change the config dynamically.
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
      browser: process.env.profile || 'firefox'

    }
  }
};
```
