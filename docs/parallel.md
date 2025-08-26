---
permalink: /parallel
title: Parallel Execution
---

# Parallel Execution

CodeceptJS has multiple approaches for running tests in parallel:

- **Test Sharding** - distributes tests across multiple machines for CI matrix execution
- `run-workers` - which spawns [NodeJS Worker](https://nodejs.org/api/worker_threads.html) in a thread. Tests are split by scenarios, scenarios are mixed between groups, each worker runs tests from its own group.
- `run-multiple` - which spawns a subprocess with CodeceptJS. Tests are split by files and configured in `codecept.conf.js`.

Workers are faster and simpler to start, while `run-multiple` requires additional configuration and can be used to run tests in different browsers at once.

## Test Sharding for CI Matrix

Test sharding allows you to split your test suite across multiple machines or CI workers without manual configuration. This is particularly useful for CI/CD pipelines where you want to run tests in parallel across different machines.

Use the `--shard` option with the `run` command to execute only a portion of your tests:

```bash
# Run the first quarter of tests
npx codeceptjs run --shard 1/4

# Run the second quarter of tests
npx codeceptjs run --shard 2/4

# Run the third quarter of tests
npx codeceptjs run --shard 3/4

# Run the fourth quarter of tests
npx codeceptjs run --shard 4/4
```

### CI Matrix Example

Here's how you can use test sharding with GitHub Actions matrix strategy:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1/4, 2/4, 3/4, 4/4]

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npx codeceptjs run --shard ${{ matrix.shard }}
```

This approach ensures:

- Each CI job runs only its assigned portion of tests
- Tests are distributed evenly across shards
- No manual configuration or maintenance of test lists
- Automatic load balancing as you add or remove tests

### Shard Distribution

Tests are distributed evenly across shards using a round-robin approach:

- If you have 100 tests and 4 shards, each shard runs approximately 25 tests
- The first shard gets tests 1-25, second gets 26-50, third gets 51-75, fourth gets 76-100
- If tests don't divide evenly, earlier shards may get one extra test

## Parallel Execution by Workers

It is easy to run tests in parallel if you have a lots of tests and free CPU cores. Just execute your tests using `run-workers` command specifying the number of workers to spawn:

```
npx codeceptjs run-workers 2
```

> ℹ Workers require NodeJS >= 11.7

This command is similar to `run`, however, steps output can't be shown in workers mode, as it is impossible to synchronize steps output from different processes.

Each worker spins an instance of CodeceptJS, executes a group of tests, and sends back report to the main process.

By default, the tests are assigned one by one to the available workers this may lead to multiple execution of `BeforeSuite()`. Use the option `--suites` to assign the suites one by one to the workers.

```sh
npx codeceptjs run-workers --suites 2
```

### Test Distribution Strategies

CodeceptJS supports three different strategies for distributing tests across workers:

#### Default Strategy (`--by test`)
Tests are pre-assigned to workers at startup, distributing them evenly across all workers. Each worker gets a predetermined set of tests to run.

```sh
npx codeceptjs run-workers 3 --by test
```

#### Suite Strategy (`--by suite`)
Test suites are pre-assigned to workers, with all tests in a suite running on the same worker. This ensures better test isolation but may lead to uneven load distribution.

```sh
npx codeceptjs run-workers 3 --by suite
```

#### Pool Strategy (`--by pool`) - **Recommended for optimal performance**
Tests are maintained in a shared pool and distributed dynamically to workers as they become available. This provides the best load balancing and resource utilization.

```sh
npx codeceptjs run-workers 3 --by pool
```

## Dynamic Test Pooling Mode

The pool mode enables dynamic test distribution for improved worker load balancing. Instead of pre-assigning tests to workers at startup, tests are stored in a shared pool and distributed on-demand as workers become available.

### Benefits of Pool Mode

* **Better load balancing**: Workers never sit idle while others are still running long tests
* **Improved performance**: Especially beneficial when tests have varying execution times
* **Optimal resource utilization**: All CPU cores stay busy until the entire test suite is complete
* **Automatic scaling**: Workers continuously process tests until the pool is empty

### When to Use Pool Mode

Pool mode is particularly effective in these scenarios:

* **Uneven test execution times**: When some tests take significantly longer than others
* **Large test suites**: With hundreds or thousands of tests where load balancing matters
* **Mixed test types**: When combining unit tests, integration tests, and end-to-end tests
* **CI/CD pipelines**: For consistent and predictable test execution times

### Usage Examples

```bash
# Basic pool mode with 4 workers
npx codeceptjs run-workers 4 --by pool

# Pool mode with grep filtering
npx codeceptjs run-workers 3 --by pool --grep "@smoke"

# Pool mode in debug mode  
npx codeceptjs run-workers 2 --by pool --debug

# Pool mode with specific configuration
npx codeceptjs run-workers 3 --by pool -c codecept.conf.js
```

### How Pool Mode Works

1. **Pool Creation**: All tests are collected into a shared pool of test identifiers
2. **Worker Initialization**: The specified number of workers are spawned
3. **Dynamic Assignment**: Workers request tests from the pool when they're ready
4. **Continuous Processing**: Each worker runs one test, then immediately requests the next
5. **Automatic Completion**: Workers exit when the pool is empty and no more tests remain

### Performance Comparison

```bash
# Traditional mode - tests pre-assigned, some workers may finish early
npx codeceptjs run-workers 3 --by test   # ✓ Good for uniform test times

# Suite mode - entire suites assigned to workers  
npx codeceptjs run-workers 3 --by suite  # ✓ Good for test isolation

# Pool mode - tests distributed dynamically
npx codeceptjs run-workers 3 --by pool   # ✓ Best for mixed test execution times
```

## Test stats with Parallel Execution by Workers

```js
const { event } = require('codeceptjs');

module.exports = function() {

  event.dispatcher.on(event.workers.result, function (result) {

    console.log(result);

  });
}

// in console log
FAIL  | 7 passed, 1 failed, 1 skipped   // 2s
{
  "tests": {
  "passed": [
    {
      "type": "test",
      "title": "Assert @C3",
      "body": "() => { }",
      "async": 0,
      "sync": true,
      "_timeout": 2000,
      "_slow": 75,
      "_retries": -1,
      "timedOut": false,
      "_currentRetry": 0,
      "pending": false,
      "opts": {},
      "tags": [
        "@C3"
      ],
      "uid": "xe4q1HdqpRrZG5dPe0JG+A",
      "workerIndex": 3,
      "retries": -1,
      "duration": 493,
      "err": null,
      "parent": {
        "title": "My",
        "ctx": {},
        "suites": [],
        "tests": [],
        "root": false,
        "pending": false,
        "_retries": -1,
        "_beforeEach": [],
        "_beforeAll": [],
        "_afterEach": [],
        "_afterAll": [],
        "_timeout": 2000,
        "_slow": 75,
        "_bail": false,
        "_onlyTests": [],
        "_onlySuites": [],
        "delayed": false
      },
      "steps": [
        {
          "actor": "I",
          "name": "amOnPage",
          "status": "success",
          "args": [
            "https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST"
          ],
          "startedAt": 1698760652610,
          "startTime": 1698760652611,
          "endTime": 1698760653098,
          "finishedAt": 1698760653098,
          "duration": 488
        },
        {
          "actor": "I",
          "name": "grabCurrentUrl",
          "status": "success",
          "args": [],
          "startedAt": 1698760653098,
          "startTime": 1698760653098,
          "endTime": 1698760653099,
          "finishedAt": 1698760653099,
          "duration": 1
        }
      ]
    }
  ],
    "failed": [],
    "skipped": []
}
}
```

CodeceptJS also exposes the env var `process.env.RUNS_WITH_WORKERS` when running tests with `run-workers` command so that you could handle the events better in your plugins/helpers

```js
const { event } = require('codeceptjs')

module.exports = function () {
  // this event would trigger the  `_publishResultsToTestrail` when running `run-workers` command
  event.dispatcher.on(event.workers.result, async () => {
    await _publishResultsToTestrail()
  })

  // this event would not trigger the  `_publishResultsToTestrail` multiple times when running `run-workers` command
  event.dispatcher.on(event.all.result, async () => {
    // when running `run` command, this env var is undefined
    if (!process.env.RUNS_WITH_WORKERS) await _publishResultsToTestrail()
  })
}
```

## Parallel Execution by Workers on Multiple Browsers

To run tests in parallel across multiple browsers, modify your `codecept.conf.js` file to configure multiple browsers on which you want to run your tests and your tests will run across multiple browsers.

Start with modifying the `codecept.conf.js` file. Add multiple key inside the config which will be used to configure multiple profiles.

```
exports.config = {
  helpers: {
    WebDriver: {
      url: 'http://localhost:3000',
      desiredCapabilties: {}
    }
  },
  multiple: {
    profile1: {
      browsers: [
        {
          browser: "firefox",
          desiredCapabilties: {
            // override capabilties related to firefox
          }
        },
        {
          browser: "chrome",
          desiredCapabilties: {
            // override capabilties related to chrome
          }
        }
      ]
    },
    profile2: {
      browsers: [
        {
          browser: "safari",
          desiredCapabilties: {
            // override capabilties related to safari
          }
        }
      ]
    }
  }
};
```

To trigger tests on all the profiles configured, you can use the following command:

```
npx codeceptjs run-workers 3 all -c codecept.conf.js
```

This will run your tests across all browsers configured from profile1 & profile2 on 3 workers.

To trigger tests on specific profile, you can use the following command:

```
npx codeceptjs run-workers 2 profile1 -c codecept.conf.js
```

This will run your tests across 2 browsers from profile1 on 2 workers.

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
const { Workers, event } = require('codeceptjs')
// here will go magic
```

Now let's see how to update this file for different parallelization modes:

### Example: Running tests in 2 browsers in 4 threads

```js
const workerConfig = {
  testConfig: './test/data/sandbox/codecept.customworker.js',
}

// don't initialize workers in constructor
const workers = new Workers(null, workerConfig)
// split tests by suites in 2 groups
const testGroups = workers.createGroupsOfSuites(2)

const browsers = ['firefox', 'chrome']

const configs = browsers.map(browser => {
  return {
    helpers: {
      WebDriver: { browser },
    },
  }
})

for (const config of configs) {
  for (group of testGroups) {
    const worker = workers.spawn()
    worker.addTests(group)
    worker.addConfig(config)
  }
}

// Listen events for failed test
workers.on(event.test.failed, failedTest => {
  console.log('Failed : ', failedTest.title)
})

// Listen events for passed test
workers.on(event.test.passed, successTest => {
  console.log('Passed : ', successTest.title)
})

// test run status will also be available in event
workers.on(event.all.result, () => {
  // Use printResults() to display result with standard style
  workers.printResults()
})

// run workers as async function
runWorkers()

async function runWorkers() {
  try {
    // run bootstrapAll
    await workers.bootstrapAll()
    // run tests
    await workers.run()
  } finally {
    // run teardown All
    await workers.teardownAll()
  }
}
```

Inside `event.all.result` you can obtain test results from all workers, so you can customize the report:

```js
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
}
```

### Example: Running Tests Split By A Custom Function

If you want your tests to split according to your need this method is suited for you. For example: If you have 4 long running test files and 4 normal test files there chance all 4 tests end up in same worker thread. For these cases custom function will be helpful.

```js
/*
 Define a function to split your tests.

 function should return an array with this format [[file1, file2], [file3], ...]

 where file1 and file2 will run in a worker thread and file3 will run in a worker thread
*/
const splitTests = () => {
  const files = [['./test/data/sandbox/guthub_test.js', './test/data/sandbox/devto_test.js'], ['./test/data/sandbox/longrunnig_test.js']]

  return files
}

const workerConfig = {
  testConfig: './test/data/sandbox/codecept.customworker.js',
  by: splitTests,
}

// don't initialize workers in constructor
const customWorkers = new Workers(null, workerConfig)

customWorkers.run()

// You can use event listeners similar to above example.
customWorkers.on(event.all.result, () => {
  workers.printResults()
})
```

### Emitting messages to the parent worker

Child workers can send non-test events to the main process. This is useful if you want to pass along information not related to the tests event cycles itself such as `event.test.success`.

```js
// inside main process
// listen for any non test related events
workers.on('message', data => {
  console.log(data)
})

workers.on(event.all.result, (status, completedTests, workerStats) => {
  // logic
})
```

## Sharing Data Between Workers

NodeJS Workers can communicate between each other via messaging system. CodeceptJS allows you to share data between different worker processes using the `share()` and `inject()` functions.

### Basic Usage

You can share data directly using the `share()` function and access it using `inject()`:

```js
// In one test or worker
share({ userData: { name: 'user', password: '123456' } })

// In another test or worker
const testData = inject()
console.log(testData.userData.name) // 'user'
console.log(testData.userData.password) // '123456'
```

### Initializing Data in Bootstrap

For complex scenarios where you need to initialize shared data before tests run, you can use the bootstrap function:

```js
// inside codecept.conf.js
exports.config = {
  bootstrap() {
    // Initialize shared data container
    share({ userData: null, config: { retries: 3 } })
  },
}
```

Then in your tests, you can check and update the shared data:

```js
const testData = inject()
if (!testData.userData) {
  // Update shared data - both approaches work:
  share({ userData: { name: 'user', password: '123456' } })
  // or mutate the injected object:
  testData.userData = { name: 'user', password: '123456' }
}
```

### Working with Proxy Objects

Since CodeceptJS 3.7.0+, shared data uses Proxy objects for synchronization between workers. The proxy system works seamlessly for most use cases:

```js
// ✅ All of these work correctly:
const data = inject()
console.log(data.userData.name) // Access nested properties
console.log(Object.keys(data)) // Enumerate shared keys
data.newProperty = 'value' // Add new properties
Object.assign(data, { more: 'data' }) // Merge objects
```

**Important Note:** Avoid reassigning the entire injected object:

```js
// ❌ AVOID: This breaks the proxy reference
let testData = inject()
testData = someOtherObject // This will NOT work as expected!

// ✅ PREFERRED: Use share() to replace data or mutate properties
share({ userData: someOtherObject }) // This works!
// or
Object.assign(inject(), someOtherObject) // This works!
```

### Local Data (Worker-Specific)

If you want to share data only within the same worker (not across all workers), use the `local` option:

```js
share({ localData: 'worker-specific' }, { local: true })
```
