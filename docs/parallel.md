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

// Listen events for failed test
workers.on(event.test.failed, (failedTest) => {
  console.log('Failed : ', failedTest.title);
});

// Listen events for passed test
workers.on(event.test.passed, (successTest) => {
  console.log('Passed : ', successTest.title);
});

// test run status will also be available in event
workers.on(event.all.result, (status, completedTests, workerStats) => {
  // print output
  console.log('Test status : ', status ? 'Passes' : 'Failed ');

  // print stats
  console.log(`Total tests : ${workerStats.tests}`);
  console.log(`Passed tests : ${workerStats.passes}`);
  console.log(`Failed test tests : ${workerStats.failures}`);

  // If you don't want to listen for failed and passed test separately, use completedTests object
  for (const test of Object.values(completedTests)) {
    console.log(`Test status: ${test.err===null}, `, `Test : ${test.title}`);
  }

  // Alternatively use printResults() to display result with proper style
  workers.printResults();
});

```

### Example: Running tests based on custom function

If you want your tests to split according to your need this method is suited for you. For ex: If you have 4 long running test files and 4 normal test files there chance all 4 tests end up in same worker thread. For these cases custom function will be helpful.

```js

/*
 Define a function to split your tests.

 function should return an array with this format [[file1, file2], [file3], ...]

 where file1 and file2 will run in a worker thread and file3 will run in a worker thread
*/
const splitTests = () => {
  const files = [
    ['./test/data/sandbox/guthub_test.js', './test/data/sandbox/devto_test.js'],
    ['./test/data/sandbox/longrunnig_test.js']
  ];

  return files;
}

const workerConfig = {
  testConfig: './test/data/sandbox/codecept.customworker.js',
  by: splitTests
};

// don't initialize workers in constructor
const customWorkers = new Workers(null,  workerCOnfig);


customWorkers.run();

// You can use event listeners similar to above example.
customWorkers.on(event.all.result, () => {
  workers.printResults();
});
```
