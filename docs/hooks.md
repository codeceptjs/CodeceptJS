# Hooks

CodeceptJS provides API to run custom code before and after the test and inject custom listeners into the event system.

## Bootstrap & Teardown

In case you need to execute arbitrary code before or after the tests,
you can use `bootstrap` and `teardown` config. Use it to start and stop webserver, Selenium, etc.

When using the [Multiple Execution](http://codecept.io/advanced/#multiple-execution) mode , there are two additional hooks available; `bootstrapAll` and `teardownAll`. These hooks are only called once each; before all of the test suites are run (`bootstrapAll`) and after all of the test suites have finished (`teardownAll`).

There are different ways to define bootstrap and teardown functions:

* JS file executed as is (synchronously).
* JS file exporting function with optional callback for async execution.
* JS file exporting an object with `bootstrap` and `teardown` methods.
* Inside JS config file

Corresponding examples provided in next sections.

## Examples

### Async Bootstrap in a Function

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

**Note**: The `bootstrapAll` and `teardownAll` hooks are only called when using [Multiple Execution](http://codecept.io/advanced/#multiple-execution).

