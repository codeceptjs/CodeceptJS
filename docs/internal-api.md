---
permalink: /internal-api
title: Internal API
---

## Concepts

In this guide we will overview the internal API of CodeceptJS.
This knowledge is required for customization, writing plugins, etc.

CodeceptJS provides an API which can be loaded via `require('codeceptjs')` when CodeceptJS is installed locally. Otherwise, you can load codeceptjs API via global `codeceptjs` object:

```js
// via module
const { recorder, event, output } = require('codeceptjs');
// or using global object
const { recorder, event, output } = codeceptjs;
```

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

### Container

CodeceptJS has a dependency injection container with helpers and support objects.
They can be retrieved from the container:

```js
const { container } = require('codeceptjs');

// get object with all helpers
const helpers = container.helpers();

// get helper by name
const { WebDriver } = container.helpers();

// get support objects
const supportObjects = container.support();

// get support object by name
const { UserPage } = container.support();

// get all registered plugins
const plugins = container.plugins();
```

New objects can also be added to container in runtime:

```js
const { container } = require('codeceptjs');

container.append({
  helpers: { // add helper
    MyHelper: new MyHelper({ config1: 'val1' });
  },
  support: { // add page object
    UserPage: require('./pages/user');
  }
})
```

> Use this trick to define custom objects inside `boostrap` script

The container also contains the current Mocha instance:

```js
const mocha = container.mocha();
```

### Event Listeners

CodeceptJS provides a module with an [event dispatcher and set of predefined events](https://github.com/Codeception/CodeceptJS/blob/master/lib/event.js).

It can be required from codeceptjs package if it is installed locally.

```js
const { event } = require('codeceptjs');

module.exports = function() {

  event.dispatcher.on(event.test.before, function (test) {

    console.log('--- I am before test --');

  });
}
```

Available events:

* `event.test.before(test)` - *async* when `Before` hooks from helpers and from test is executed
* `event.test.after(test)` - *async* after each test
* `event.test.started(test)` - *sync* at the very beginning of a test.
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
* `event.workers.before` - before spawning workers in parallel run
* `event.workers.after` - after workers finished in parallel run
* `event.workers.result` - test results after workers finished in parallel run


> *sync* - means that event is fired in the moment of the action happening.
 *async* - means that event is fired when an action is scheduled. Use `recorder` to schedule your actions.

For further reference look for [currently available listeners](https://github.com/Codeception/CodeceptJS/tree/master/lib/listener) using the event system.


### Recorder

To inject asynchronous functions in a test or before/after a test you can subscribe to corresponding event and register a function inside a recorder object. [Recorder](https://github.com/Codeception/CodeceptJS/blob/master/lib/recorder.js) represents a global promises chain.

Provide a function in the first parameter, a function must be async or must return a promise:

```js
const { event, recorder } = require('codeceptjs');

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

### Config

CodeceptJS config can be accessed from `require('codeceptjs').config.get()`:

```js
const { config } = require('codeceptjs');

// config object has access to all values of the current config file

if (config.get().myKey == 'value') {
  // run something
}
```


### Output

Output module provides four verbosity levels. Depending on the mode you can have different information printed using corresponding functions.

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

#### Test Object

The test events are providing a test object with following properties:

* `title` title of the test
* `body` test function as a string
* `opts` additional test options like retries, and others
* `pending` true if test is scheduled for execution and false if a test has finished
* `tags` array of tags for this test
* `artifacts` list of files attached to this test. Screenshots, videos and other files can be saved here and shared accross different reporters
* `file` path to a file with a test
* `steps` array of executed steps (available only in `test.passed`, `test.failed`, `test.finished` event)
* `skipInfo` additional test options when test skipped 
* * `message` string with reason for skip
* * `description` string with test body
and others

#### Step Object

Step events provide step objects with following fields:

* `name` name of a step, like 'see', 'click', and others
* `actor` current actor, in most cases it is `I`
* `helper` current helper instance used to execute this step
* `helperMethod` corresponding helper method, in most cases is the same as `name`
* `status` status of a step (passed or failed)
* `prefix` if a step is executed inside `within` block contain within text, like: 'Within .js-signup-form'.
* `args` passed arguments

Whenever you execute tests with `--verbose` option you will see registered events and promises executed by a recorder.

## Custom Runner

You can run CodeceptJS tests from your script.

```js
const { codecept: Codecept } = require('codeceptjs');

// define main config
const config = { 
  helpers: { 
    WebDriver: { 
      browser: 'chrome', 
      url: 'http://localhost' 
    }
  }
};

const opts = { steps: true };

// run CodeceptJS inside async function
(async () => {
  const codecept = new Codecept(config, options);
  codecept.init(__dirname);

  try {
    await codecept.bootstrap();
    codecept.loadTests('**_test.js');
    // run tests
    await codecept.run(test);
  } catch (err) {
    printError(err);
    process.exitCode = 1;
  } finally {
    await codecept.teardown();
  }    
})();
```

> Also, you can run tests inside workers in a custom scripts. Please refer to the [parallel execution](/parallel) guide for more details.
