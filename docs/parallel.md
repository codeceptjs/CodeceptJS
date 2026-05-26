---
permalink: /parallel
title: Parallel Execution
---

# Parallel Execution

Two built-in ways to run tests in parallel:

- **`run-workers`** — split tests across worker threads on one runner.
- **`--shard`** — split test files across CI machines in a matrix build.

For anything more specific — your own grouping, a config per group, several browsers at once — drive the `Workers` API from a script (see [Custom parallelization](#custom-parallelization)).

## Workers

`run-workers <N>` spawns `N` [worker threads](https://nodejs.org/api/worker_threads.html), each an independent CodeceptJS instance running a slice of the suite, and merges the results:

```sh
npx codeceptjs run-workers 4
```

Steps are not streamed to the console in this mode — output from separate threads can't be interleaved cleanly. While workers run, CodeceptJS sets `process.env.RUNS_WITH_WORKERS=true`, so plugins and helpers can branch on it. All `run` options work here too: `--grep "@smoke"`, `-c codecept.conf.js`, `--debug`, and the rest.

### Distribution strategies

`--by` controls how tests spread across workers:

| `--by` | How tests are assigned | Use when |
| --- | --- | --- |
| `test` (default) | each test pinned to a worker up front | tests take roughly equal time |
| `suite` | each suite pinned to a worker; its tests stay together | suites share a `BeforeSuite` you don't want repeated |
| `pool` | workers pull the next test from a shared queue as they free up | test durations vary — best load balancing |

```sh
npx codeceptjs run-workers 4 --by pool
```

`--suites` is shorthand for `--by suite`.

### Multiple browsers

Define browser profiles under `multiple` in `codecept.conf.js`:

```js
multiple: {
  default: { browsers: ['chrome', 'firefox'] },
}
```

Then run a profile across workers — by name, or `all` for every profile:

```sh
npx codeceptjs run-workers 3 default
npx codeceptjs run-workers 3 all
```

(`run-multiple` runs the same profiles in separate subprocesses instead of threads — see `npx codeceptjs run-multiple --help`.)

### Reading worker results

When all workers finish, the run fires `event.workers.result` with the merged result:

```js
import { event } from 'codeceptjs'

export default function () {
  event.dispatcher.on(event.workers.result, result => {
    console.log(result.hasFailed() ? 'FAILED' : 'PASSED', result.stats)
    for (const test of result.tests) {
      console.log(test.title, test.duration, 'ms', `worker ${test.workerIndex}`)
    }
  })
}
```

For end-of-run work like publishing to a test-management tool, listen on `event.workers.result` (fires once) rather than `event.all.result` (fires in every worker).

## Sharding

`--shard <index>/<total>` runs only a slice of your **test files**: the file list is cut into `total` even chunks and this run executes chunk `index`. It is built for CI matrices — one machine per shard, each running `run`:

```sh
npx codeceptjs run --shard 1/4
npx codeceptjs run --shard 2/4
```

GitHub Actions:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: ['1/4', '2/4', '3/4', '4/4']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx codeceptjs run --shard ${{ matrix.shard }}
```

Add or remove tests freely — shards rebalance automatically.

## Custom parallelization

When the built-in commands aren't enough, build a runner with the `Workers` API: decide which tests go to which group, give each group its own config, and listen for results.

```js
#!/usr/bin/env node
import { Workers, event } from 'codeceptjs'

const workers = new Workers(null, { testConfig: './codecept.conf.js' })

// split the suite into 2 groups, run each group on two browsers
const groups = workers.createGroupsOfSuites(2)
for (const browser of ['chromium', 'firefox']) {
  for (const group of groups) {
    const worker = workers.spawn()
    worker.addTests(group)
    worker.addConfig({ helpers: { Playwright: { browser } } })
  }
}

workers.on(event.test.failed, t => console.log('FAIL', t.title))
workers.on(event.all.result, () => workers.printResults())

await workers.bootstrapAll()
try {
  await workers.run()
} finally {
  await workers.teardownAll()
}
```

Building blocks:

- `new Workers(N, { testConfig, options })` — `N` workers; pass `null` to spawn them yourself with `spawn()`.
- `createGroupsOfTests(n)` / `createGroupsOfSuites(n)` — split the suite into `n` groups.
- `worker.addTests(group)` / `worker.addConfig(partialConfig)` — assign tests and config overrides to a spawned worker.
- `bootstrapAll()` → `run()` → `teardownAll()` — lifecycle (wrap `run()` in `try/finally` so teardown always runs).
- Events on the `workers` object: `event.test.passed`, `event.test.failed`, `event.all.result`, plus `'message'` for anything a child worker sends. `printResults()` prints the standard summary; `result.hasFailed()` and `result.stats` give the totals.

To split by your own rule, pass a function as `by` — it receives the worker count and returns an array of file groups:

```js
const splitTests = () => [
  ['./test/login_test.js', './test/signup_test.js'],  // group 1
  ['./test/slow_checkout_test.js'],                    // group 2
]

const workers = new Workers(2, { testConfig: './codecept.conf.js', by: splitTests })
workers.on(event.all.result, () => workers.printResults())
await workers.run()
```

## Sharing data between workers

Worker threads don't share memory. `share()` publishes a value that any worker reads with `inject()`:

```js
// in any test or hook
share({ user: { name: 'jane', password: 's3cret' } })

// anywhere else, even in another worker
const { user } = inject()
```

Seed shared state before tests run from `bootstrap()`:

```js
// codecept.conf.js
export const config = {
  bootstrap() {
    share({ user: null })
  },
}
```

Shared data is a Proxy. Don't reassign the injected object itself (`let d = inject(); d = {…}` breaks the link); mutate it or call `share()` again. Pass `{ local: true }` to keep a value inside one worker:

```js
share({ tmpFile: '/tmp/run-1' }, { local: true })
```
