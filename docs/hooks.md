# Hooks

CodeceptJS provides API to run custom code before and after the test and inject custom listeners into the event system.

## Bootstrap & Teardown

In case you need to execute arbitrary code before or after the tests,
you can use `bootstrap` and `teardown` config. Use it to start and stop webserver, Selenium, etc.

There are different ways to define bootstrap and teardown functions:

* JS file executed as is (synchronously).
* JS file exporting function with optional callback for async execution.
* JS file exporting an object with `bootstrap` and `teardown` methods.
* Inside JS config file

Corresponding examples provided in next sections.

##### Example: Async Bootstrap in a Function

Add to `codecept.json`:

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

##### Example: Async Teardown in a Function

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

##### Example: Bootstrap & Teardown Inside an Object

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

##### Example: Bootstrap & Teardown Inside Config

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

## Hooks

To extend internal CodeceptJS functionality you can use hooks.
CodeceptJS provides API to connect to its internal event dispatcher, container, output, promise recorder, so you could hook into it to create your own reporters, test listeners, etc.

Hooks are JavaScript files same as for bootstrap and teardown, which can be registered inside `hooks` section of config. Unlike `bootstrap` you can have multiple hooks registered:

```json
"hooks": [
  "./server.js",
  "./data_builder.js",
  "./report_notification.js"
]
```

Inside those JS files you can use CodeceptJS API to access its internals.

## API

CodeceptJS provides an API which can be loaded via `require('codeceptjs')` when CodeceptJS is installed locally.
These internal objects are available:

* [`codecept`](https://github.com/Codeception/CodeceptJS/blob/master/lib/codecept.js): test runner class
* [`config`](https://github.com/Codeception/CodeceptJS/blob/master/lib/config.js): current codecept config
* [`event`](https://github.com/Codeception/CodeceptJS/blob/master/lib/event.js): event listener
* [`recorder`](https://github.com/Codeception/CodeceptJS/blob/master/lib/recorder.js): global promise chain
* [`output`](https://github.com/Codeception/CodeceptJS/blob/master/lib/output.js): internal printer
* [`container`](https://github.com/Codeception/CodeceptJS/blob/master/lib/container.js): dependency injection container for tests, includes current helpers and support objects
* [`helper`](https://github.com/Codeception/CodeceptJS/blob/master/lib/helper.js): basic helper class
* [`actor`](https://github.com/Codeception/CodeceptJS/blob/master/lib/actor.js): basic actor (I) class

[API reference](https://github.com/Codeception/CodeceptJS/tree/master/docs/api) is available on GitHub.
Also please check the source code of corresponding modules.

### Config

CodeceptJS config can be accessed from `require('codeceptjs').config.get()`:

```js

let config = require('codeceptjs').config.get();

if (config.myKey == 'value') {
  // run hook
}
```

### Event Listeners

CodeceptJS provides a module with [event dispatcher and set of predefined events](https://github.com/Codeception/CodeceptJS/blob/master/lib/event.js).

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

* `event.test.started(test)` - at the very beginning of a test. Passes a current test object.
* `event.test.before` - when `Before` hooks from helpers and from test is executed
* `event.test.after` - after each test
* `event.test.passed(test)` - when test passed
* `event.test.failed(test, error)` - when test failed
* `event.suite.before(suite)` - before a suite
* `event.suite.after(suite)` - after a suite
* `event.step.started(step)` - when step hooks from helpers executed. Passes current step object.
* `event.step.before` - at the very beginning of a step
* `event.step.after`- after a step
* `event.all.before` - before running tests
* `event.all.after` - after running tests
* `event.all.result` - when results are printed

For further reference look for [currently available listeners](https://github.com/Codeception/CodeceptJS/tree/master/lib/listener) using event system.

#### Test Object

Test events provide a test object with following fields:

* `title` title of a test
* `body` test function as a string
* `opts` additional test options like retries, and others
* `pending` true if test is scheduled for execution and false if a test has finished
* `file` path to a file with a test.
* `steps` array of executed steps (available only in `test.passed` or `test.failed` event)

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

To inject asynchronous functions in a test or before/after a test you can subscribe to corresponding event and register a function inside a recorder object. [Recorder](https://github.com/Codeception/CodeceptJS/blob/master/lib/recorder.js) represents a global promises chain.

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
let WebDriverIO = container.helpers('WebDriverIO');

// get support objects
let support = container.support();

// get support object by name
let UserPage = container.support('UserPage');
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

## Custom Runner

CodeceptJS can be imported and used in custom runners.
To initialize Codecept you need to create Config and Container objects.

```js
let Container = require('codeceptjs').container;
let Codecept = require('codeceptjs').codecept;

let config = { helpers: { WebDriverIO: { browser: 'chrome', url: 'http://localhost' } } };
let opts = { steps: true };

// create runner
let codecept = new Codecept(config, opts);

// create helpers, support files, mocha
Container.create(config, opts);

// initialize listeners
codecept.bootstrap();

// load tests
codecept.loadTests('*_test.js');

// run tests
codecept.run();
```

In this way Codecept runner class can be extended.

## done()
