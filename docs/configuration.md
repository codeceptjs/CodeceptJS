# Configuration

CodeceptJS configuration is set in `codecept.json` file.

After running `codeceptjs init` it should be saved in test root.

Here is an overview of available options with their defaults:

* **tests**: `"./*_test.js"` - pattern to locate tests
* **include**: `{}` - actors and pageobjects to be registered in DI container and included in tests.
* **timeout**: `10000` - default tests timeout
* **output**: `"./output"` - where to store failure screenshots, etc
* **helpers**: `{}` - list of enabled helpers
* **mocha**: `{}` - mocha options, [reporters](http://codecept.io/reports/) can be configured here
* **multiple**: `{}` - multiple options, see [#PR439](https://github.com/Codeception/CodeceptJS/pull/439) for more details
* **name**: `"tests"` - test suite name (not used)
* **bootstrap**: `"./bootstrap.js"` - an option to run code _before_ tests are run. See [Hooks](#hooks)).
* **teardown**: - an option to run code _after_ tests are run. See [Hooks](#hooks)).
* **translation**: - [locale](http://codecept.io/translation/) to be used to print steps output, as well as used in source code.


## Dynamic Configuration

 By default `codecept.json` is used for configuration. You can override its values in runtime by using `--override` or `-o` option in command line, passing valid JSON as a value:

```
codeceptjs run -o '{ "helpers": {"WebDriverIO": {"browser": "firefox"}}}'
```

 You can also switch to JS configuration format for more dynamic options.
 Create `codecept.conf.js` file and make it export `config` property.

 See the config example:

```js
exports.config = {
  helpers: {
    WebDriverIO: {
      // load variables from the environment and provide defaults
      url: process.env.CODECEPT_URL || 'http://localhost:3000',

      user: process.env.CLOUDSERVICE_USER,
      key: process.env.CLOUDSERVICE_KEY,

      coloredLogs: true,
      waitforTimeout: 10000
    }
  },

  // don't build monolithic configs
  mocha: require('./mocha.conf.js') || {},

  // here goes config as it was in codecept.json
  // ....
};
```

(Don't copy-paste this config, it's just demo)

## Profile

Using values from `process.profile` you can change the config dynamically.
It provides value of `--profile` option passed to runner.
Use its value to change config value on the fly.

For instance, with the config above we can change browser value using `profile` option

```
codeceptjs run --profile firefox
```

```js
exports.config = {
  helpers: {
    WebDriverIO: {
      url: 'http://localhost:3000',
      // load value from `profile`
      browser: process.profile || 'firefox'

    }
  }
};
```
