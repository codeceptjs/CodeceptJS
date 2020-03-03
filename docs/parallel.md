---
permalink: /parallel
title: Parallel Execution
---

# Parallel Execution

CodeceptJS has two engines for running tests in parallel:

* `run-workers` - which spawns [NodeJS Worker](https://nodejs.org/api/worker_threads.html) in a thread. Tests are split by scenarios, scenarios are mixed between groups, each worker runs tests from its own group.
* `run-multiple` - which spawns a subprocess with CodeceptJS. Tests are split by files and configured in `codecept.conf.js`.

Workers are faster and simpler to start, while `run-multiple` requires additional configuration and can be used to run tests in different browsers at once.

## Parallel Execution by Workers

It is easy to run tests in parallel if you have a lots of tests and free CPU cores. Just execute your tests using `run-workers` command specifying the number of workers to spawn:

```
npx codeceptjs run-workers 2
```

> ℹ Workers require NodeJS >= 11.7

This command is similar to `run`, however, steps output can't be shown in workers mode, as it is impossible to synchronize steps output from different processes.

Each worker spins an instance of CodeceptJS, executes a group of tests, and sends back report to the main process.

By default the tests are assigned one by one to the avaible workers this may lead to multiple execution of `BeforeSuite()`. Use the option `--suites` to assigne the suites one by one to the workers.

```sh
npx codeceptjs run-workers --suites 2
```

## Custom Parallel Execution

To get a full control of parallelization create a custom execution script to match your needs.
This way you can configure which tests are matched, how the groups are formed, and with which configuration each worker is executed.

Start with creating file `bin/parallel.js`.

On MacOS/Linux run following commands:

```
mkdir bin
touch bin/parallel.js
chmod +x bin/parallel.js
```

> Filename or directory can be customized. You are creating your own custom runner so take this paragraph as an example.

Create a placeholder in file:

```js
#!/usr/bin/env node
const { Workers } = require('codeceptjs');
// here will go magic
```

Now let's see how to update this file for different parallelization modes:

### Example: Running tests in 2 browsers in 4 threads

```js
const workerConfig = {
  testConfig: './test/data/sandbox/codecept.customworker.js',
};

// don't initialize workers in constructor
const workers = new Workers(null, workerConfig);
// split tests by suites in 2 groups
const testGroups = workers.createGroupsOfSuites(2);

const browsers = ['firefox', 'chrome'];

const configs = browsers.map(browser => {
  return helpers: { 
    WebDriver: { browser }
  }
});

for (const config of configs) {
  for (group of groupOfTests) {
    const worker = workers.spawn();
    worker.addTests(group);
    worker.addConfig(config);
  }
}

workers.run();

workers.on(event.all.result, (status, completed, workerStats) => {
  // print output
});

```