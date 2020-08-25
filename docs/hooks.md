---
permalink: /hooks
title: Bootstrap / Teardown / Plugins
---

# Bootstrap / Teardown / Plugins

CodeceptJS provides API to run custom code before and after the test and inject custom listeners into the event system.

## Bootstrap & Teardown

In case you need to execute arbitrary code before or after the tests,
you can use `bootstrap` and `teardown` config. Use it to start and stop webserver, Selenium, etc.

When using the [Multiple Execution](http://codecept.io/advanced/#multiple-execution) mode, there are two additional hooks available; `bootstrapAll` and `teardownAll`. See [BootstrapAll & TeardownAll](#bootstrapall-teardownall) for more information.

There are different ways to define bootstrap and teardown functions:

* JS file executed as is (synchronously).
* JS file exporting function with optional callback for async execution.
* JS file exporting an object with `bootstrap` and `teardown` methods.
* Inside JS config file

Corresponding examples provided in next sections.

### Example: Async Bootstrap in a Function

Add to `codecept.conf.js`:

```json
"bootstrap": "./run_server.js"
```

Export a function in your bootstrap file:

```js
// bootstrap.js
var server = require('./app_server');
module.exports = function(done) {
  // on error call done('error description') to stop
  if (!server.validateConfig()) {
    done("Can't execute server with invalid config, tests stopped");
  }
  // call done() to continue execution
  server.run(done);
}
```

### Example: Async Teardown in a Function

Stopping a server from a previous example can be done in a similar manner.
Create a teardown file and add it to `codecept.json`:

```json
"teardown": "./stop_server.js"
```

Inside `stop_server.js`:

```js
var server = require('./app_server');
module.exports = function(done) {
  server.stop(done);
}
```

### Example: Bootstrap & Teardown Inside an Object

Examples above can be combined into one file.

Add to config (`codecept.json`):

```js
  "bootstrap": "./server.js"
  "teardown": "./server.js"
```

`server.js` should export object with `bootstrap` and `teardown` functions:

```js
// bootstrap.js
var server = require('./app_server');
module.exports = {
  bootstrap: function(done) {
    server.start(done);
  },
  teardown: function(done) {
    server.stop(done);
  }
}
```

### Example: Bootstrap & Teardown Inside Config

If you are using JavaScript-style config `codecept.conf.js`, bootstrap and teardown functions can be placed inside of it:

```js
var server = require('./app_server');

exports.config = {
  tests: "./*_test.js",
  helpers: {},

  // adding bootstrap/teardown
  bootstrap: function(done) {
    server.launch(done);
  },
  teardown: function(done) {
    server.stop(done);
  }
  // ...
  // other config options
}

```

## BootstrapAll & TeardownAll

There are two additional hooks for [parallel execution](http://codecept.io/parallel) in `run-multiple` or `run-workers` commands.

These hooks are only called in the parent process. Before child processes start (`bootstrapAll`) and after all of runs have finished (`teardownAll`). Unlike them, the `bootstrap` and `teardown` hooks are called between and after each of child processes respectively.

For example, when you run tests in 2 workers using the following command:

```
npx codeceptjs run-workers 2
```

First, `bootstrapAll` is called. Then two `bootstrap` runs in each of workers. Then tests in worker #1 ends and `teardown` is called. Same for worker #2. Finally, `teardownAll` runs in the main process.

> The same behavior is set for `run-multiple` command

The `bootstrapAll` and `teardownAll` hooks are preferred to use for setting up common logic of tested project: to start application server or database, to start webdriver's grid.

The `bootstrap` and `teardown` hooks are used for setting up each testing browser: to create unique [cloud testing server](/helpers/WebDriverIO#cloud-providers) connection or to create specific browser-related test data in database (like users with names with browsername in it).

Same as `bootstrap` and `teardown`, there are 3 ways to define `bootstrapAll` and `teardownAll` functions:

* JS file executed as is (synchronously).
* JS file exporting function with optional callback for async execution.
* JS file exporting an object with `bootstrapAll` and `teardownAll` methods.
* Inside JS config file

### Example: BootstrapAll & TeardownAll Inside Config

Using JavaScript-style config `codecept.conf.js`, bootstrapAll and teardownAll functions can be placed inside of it:


```js
const fs = require('fs');
const tempFolder = process.cwd() + '/tmpFolder';

exports.config = {
  tests: "./*_test.js",
  helpers: {},

  multiple: {
    suite1: {
      grep: '@suite1',
      browsers: [ 'chrome', 'firefox' ],
    },
    suite2: {
      grep: '@suite2',
      browsers: [ 'chrome' ],
    },
  },

  // adding bootstrapAll/teardownAll
  bootstrapAll: function(done) {
    fs.mkdir(tempFolder, (err) => {
      console.log('Create a temp folder before all test suites start', err);
      done();
    });
  },

  bootstrap: function(done) {
    console.log('Do some pretty suite setup stuff');
    done(); // Don't forget to call done()
  },

  teardown: function(done) {
    console.log('Cool, one of the test suites have finished');
    done();
  },

  teardownAll: function(done) {
    console.log('All suites are now done so we should clean up the temp folder');

    fs.rmdir(tempFolder, (err) => {
      console.log('Ok, now I am done', err);
      done();
    });
  },

  // ...
  // other config options
}
```

### Example: Bootstrap & Teardown Inside an Object

Examples above can be combined into one file.

Add to config (`codecept.json`):

```js
  "bootstrapAll": "./presettings.js"
  "teardownAll": "./presettings.js"
  "bootstrap": "./presettings.js"
  "teardown": "./presettings.js"
```

`presettings.js` should export object with `bootstrap` and `teardown` functions:

```js
// presettings.js
const server = require('./app_server');
const browserstackConnection = require("./browserstackConnection");
const uniqueIdentifier = generateSomeUniqueIdentifierFunction();

module.exports = {
  bootstrapAll: function(done) {
    server.start(done);
  },
  teardownAll: function(done) {
    server.stop(done);
  },
  bootstrap: function(done) {
    browserstackConnection.connect(uniqueIdentifier);
  },
  teardown: function(done) {
    browserstackConnection.disconnect(uniqueIdentifier);
  },
}
```

**Remember**: The `bootstrapAll` and `teardownAll` hooks are only called when using [Multiple Execution](http://codecept.io/advanced/#multiple-execution).

## Plugins

Plugins allow to use CodeceptJS internal API to extend functionality. Use internal event dispatcher, container, output, promise recorder, to create your own reporters, test listeners, etc.

CodeceptJS includes [built-in plugins](/plugins/) which extend basic functionality and can be turned on and off on purpose. Taking them as [examples](https://github.com/codeceptjs/CodeceptJS/tree/master/lib/plugin) you can develop your custom plugins.

A plugin is a basic JS module returning a function. Plugins can have individual configs which are passed into this function:

```js
const defaultConfig = {
  someDefaultOption: true
}

module.exports = function(config) {
  config = Object.assign(defaultConfig, config);
  // do stuff
}
```

Plugin can register event listeners or hook into promise chain with recorder. See [API reference](https://github.com/codeceptjs/CodeceptJS/tree/master/lib/helper).

To enable your custom plugin in config add it to `plugins` section. Specify path to node module using `require`.

```js
"plugins": {
  "myPlugin": {
    "require": "./path/to/my/module",
    "enabled": true
  }
}
```

* `require` - specifies relative path to a plugin file. Path is relative to config file.
* `enabled` - to enable this plugin.

If a plugin is disabled (`enabled` is not set or false) this plugin can be enabled from command line:

```
./node_modules/.bin/codeceptjs run --plugin myPlugin
```

Several plugins can be enabled as well:

```
./node_modules/.bin/codeceptjs run --plugin myPlugin,allure
```

### Example: Execute code for a specific group of tests

If you need to execute some code before a group of tests, you can [mark these tests with a same tag](/advanced/#tags). Then to listen for tests where this tag is included (see [test object api](#test-object)).

Let's say we need to populate database for a group of tests.

```js
// populate database for slow tests
const event = require('codeceptjs').event;

module.exports = function() {

  event.dispatcher.on(event.test.before, function (test) {

    if (test.tags.indexOf('@populate') >= 0) {
      recorder.add('populate database', async () => {
        // populate database for this test
      })
    }
  });
}
```

### Example: Check URL before running a test

If you want to share bootstrap script or run multiple bootstraps, it's a good idea to wrap that script into a plugin.
Plugin can also execute JS before tests but you need to use internal APIs to synchronize promises.

```js
const { recorder } = require('codeceptjs');

module.exports = function(options) {

  event.dispatcher.on(event.all.before, function () {
    recorder.startUnlessRunning(); // start recording promises
    recorder.add('do some async stuff', async () => {
      // your code
    });
  });
}
```

## API

**Use local CodeceptJS installation to get access to `codeceptjs` module**

CodeceptJS provides an API which can be loaded via `require('codeceptjs')` when CodeceptJS is installed locally.
These internal objects are available:

* [`codecept`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/codecept.js): test runner class
* [`config`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/config.js): current codecept config
* [`event`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/event.js): event listener
* [`recorder`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/recorder.js): global promise chain
* [`output`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/output.js): internal printer
* [`container`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/container.js): dependency injection container for tests, includes current helpers and support objects
* [`helper`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/helper.js): basic helper class
* [`actor`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/actor.js): basic actor (I) class

[API reference](https://github.com/codeceptjs/CodeceptJS/tree/master/docs/api) is available on GitHub.
Also please check the source code of corresponding modules.

### Event Listeners

CodeceptJS provides a module with [event dispatcher and set of predefined events](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/event.js).

It can be required from codeceptjs package if it is installed locally.

```js
const event = require('codeceptjs').event;

module.exports = function() {

  event.dispatcher.on(event.test.before, function (test) {

    console.log('--- I am before test --');

  });
}
```

Available events:

* `event.test.before(test)` - *async* when `Before` hooks from helpers and from test is executed
* `event.test.after(test)` - *async* after each test
* `event.test.started(test)` - *sync* at the very beginning of a test. Passes a current test object.
* `event.test.passed(test)` - *sync* when test passed
* `event.test.failed(test, error)` - *sync* when test failed
* `event.test.finished(test)` - *sync* when test finished
* `event.suite.before(suite)` - *async* before a suite
* `event.suite.after(suite)` - *async* after a suite
* `event.step.before(step)` - *async* when the step is scheduled for execution
* `event.step.after(step)`- *async* after a step
* `event.step.started(step)` - *sync* when step starts.
* `event.step.passed(step)` - *sync* when step passed.
* `event.step.failed(step, err)` - *sync* when step failed.
* `event.step.finished(step)` - *sync* when step finishes.
* `event.step.comment(step)` - *sync* fired for comments like `I.say`.
* `event.all.before` - before running tests
* `event.all.after` - after running tests
* `event.all.result` - when results are printed

* *sync* - means that event is fired in the moment of action happens.
* *async* - means that event is fired when an actions is scheduled. Use `recorder` to schedule your actions.

For further reference look for [currently available listeners](https://github.com/codeceptjs/CodeceptJS/tree/master/lib/listener) using event system.

#### Test Object

Test events provide a test object with following fields:

* `title` title of a test
* `body` test function as a string
* `opts` additional test options like retries, and others
* `pending` true if test is scheduled for execution and false if a test has finished
* `tags` array of tags for this test
* `file` path to a file with a test.
* `steps` array of executed steps (available only in `test.passed`, `test.failed`, `test.finished` event)
* `skipInfo` additional test options when test skipped 
* * `message` string with reason for skip
* * `description` string with test body
and others

#### Step Object

Step events provide step objects with following fields:

* `name` name of a step, like 'see', 'click', and others
* `actor` current actor, in most cases it `I`
* `helper` current helper instance used to execute this step
* `helperMethod` corresponding helper method, in most cases is the same as `name`
* `status` status of a step (passed or failed)
* `prefix` if a step is executed inside `within` block contain within text, like: 'Within .js-signup-form'.
* `args` passed arguments

### Recorder

To inject asynchronous functions in a test or before/after a test you can subscribe to corresponding event and register a function inside a recorder object. [Recorder](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/recorder.js) represents a global promises chain.

Provide a function description as a first parameter, function should return a promise:

```js
const event = require('codeceptjs').event;
const recorder = require('codeceptjs').recorder;
module.exports = function() {

  event.dispatcher.on(event.test.before, function (test) {

    const request = require('request');

    recorder.add('create fixture data via API', function() {
      return new Promise((doneFn, errFn) => {
        request({
          baseUrl: 'http://api.site.com/',
          method: 'POST',
          url: '/users',
          json: { name: 'john', email: 'john@john.com' }
        }), (err, httpResponse, body) => {
          if (err) return errFn(err);
          doneFn();
        }
      });
    }
  });
}

```

Whenever you execute tests with `--verbose` option you will see registered events and promises executed by a recorder.


### Output

Output module provides 4 verbosity levels. Depending on the mode you can have different information printed using corresponding functions.

* `default`: prints basic information using `output.print`
* `steps`: toggled by `--steps` option, prints step execution
* `debug`: toggled by `--debug` option, prints steps, and debug information with `output.debug`
* `verbose`: toggled by `--verbose` prints debug information and internal logs with `output.log`

It is recommended to avoid `console.log` and use output.* methods for printing.

```js
const output = require('codeceptjs').output;

output.print('This is basic information');
output.debug('This is debug information');
output.log('This is verbose logging information');
```

### Container

CodeceptJS has a dependency injection container with Helpers and Support objects.
They can be retrieved from the container:

```js
let container = require('codeceptjs').container;

// get object with all helpers
let helpers = container.helpers();

// get helper by name
let WebDriver = container.helpers('WebDriver');

// get support objects
let support = container.support();

// get support object by name
let UserPage = container.support('UserPage');

// get all registered plugins
let plugins = container.plugins();
```

New objects can also be added to container in runtime:

```js
let container = require('codeceptjs').container;

container.append({
  helpers: { // add helper
    MyHelper: new MyHelper({ config1: 'val1' });
  },
  support: { // add page object
    UserPage: require('./pages/user');
  }
})
```

Container also contains current Mocha instance:

```js
let mocha = container.mocha();
```

### Config

CodeceptJS config can be accessed from `require('codeceptjs').config.get()`:

```js

let config = require('codeceptjs').config.get();

if (config.myKey == 'value') {
  // run hook
}
```


## Custom Runner

> 📺 [Watch this](https://www.youtube.com/watch?v=3eZtVL0Ad0A) material on YouTube

CodeceptJS can be imported and used in custom runners.
To initialize Codecept you need to create Config and Container objects.

```js
const { container: Container, codecept: Codecept } = require('codeceptjs');

const config = { helpers: { WebDriver: { browser: 'chrome', url: 'http://localhost' } } };
const opts = { steps: true };

// create runner
const codecept = new Codecept(config, opts);

// initialize codeceptjs in current dir
codecept.initGlobals(__dirname);

// create helpers, support files, mocha
Container.create(config, opts);

// initialize listeners
codecept.runHooks();

// run bootstrap function from config
codecept.runBootstrap((err) => {

  // load tests
  codecept.loadTests('*_test.js');

  // run tests
  codecept.run();
});

```

In this way Codecept runner class can be extended.

