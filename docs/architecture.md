---
permalink: /architecture
title: Architecture
---

# CodeceptJS Architecture

How CodeceptJS runs a test, and the internal modules you build [plugins, listeners, and helpers](/hooks) against.

## How a Test Runs

CodeceptJS is built on top of [Mocha](https://mochajs.org). A run goes through these stages:

1. **Load.** CodeceptJS reads the config, builds the [container](#container) (helpers, support objects, plugins), and runs the `bootstrap` hook. `event.all.before` fires.
2. **Suite.** For each suite, `event.suite.before` fires. Helper `_beforeSuite` hooks run.
3. **Test.** For each test: `event.test.started` fires; `Before` hooks from helpers (`_before`) and from the suite run, then `event.test.before` fires; the scenario function runs; `event.test.passed` or `event.test.failed` fires; `After` hooks run; `event.test.after` and then `event.test.finished` fire.
4. **Step.** Each `I.*` call inside a scenario becomes a step. It is *scheduled* onto the [recorder](#the-recorder) — `event.step.before` fires — then executed: `event.step.started`, `event.step.passed` or `event.step.failed`, `event.step.after`, `event.step.finished`.
5. **Finish.** `event.suite.after` fires after each suite, `event.all.after` after the last one, and `event.all.result` when results are printed. The `teardown` hook runs.

The key idea is step 4: **a scenario doesn't execute its steps as it runs** — it queues them. `I.click()` returns immediately; the [recorder](#the-recorder) runs the queued action later. This is why scenarios rarely need `await`, and why anything that injects async work has to go through the recorder.

## The Internal API

CodeceptJS exposes its internals as named exports of the `codeceptjs` package. Import only what you need:

```js
import { recorder, event, output, container, config } from 'codeceptjs'
```

| Export | What it is |
| --- | --- |
| [`codecept`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/codecept.js) | the test runner class |
| [`config`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/config.js) | the loaded configuration |
| [`container`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/container.js) | dependency-injection container: helpers, support objects, plugins, the Mocha instance |
| [`recorder`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/recorder.js) | the global promise chain that orders every step |
| [`event`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/event.js) | the event dispatcher and the names of all lifecycle events |
| [`output`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/output.js) | the printer used for all console output |
| [`store`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/store.js) | global state of the run — current test/step, run modes, directories |
| [`helper`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/helper.js) | the base class every helper extends |
| [`actor`](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/actor.js) | the base class behind the `I` object |

> Older code relied on a global `codeceptjs` object (`const { recorder } = codeceptjs`). That global only exists under `noGlobals: false`, the deprecated 3.x default — prefer named imports.

The [API reference](https://github.com/codeceptjs/CodeceptJS/tree/master/docs/api) on GitHub documents these modules; the source is the final word.

## The Recorder

The recorder is a single global promise chain. Every step a scenario "calls" is appended to it, and the chain runs the steps one after another. To run your own async code at the right point in a test, append it to the recorder too:

```js
import { event, recorder } from 'codeceptjs'

event.dispatcher.on(event.test.before, () => {
  recorder.add('seed fixture data', async () => {
    await api.post('/users', { name: 'john', email: 'john@example.com' })
  })
})
```

- `recorder.add(name, fn)` — append `fn` (async, or returning a promise) to the chain. The name shows up in `--verbose` output.
- `recorder.startUnlessRunning()` — start a chain if none is running. Call it before `add()` from a listener that may fire outside a running chain, such as `event.all.before`.
- `recorder.retry({ retries, when })` — retry failing steps that match `when`. See [conditional retries](/helpers#conditional-retries).

Run tests with `--verbose` to watch the recorder schedule and execute each entry.

## Container

The container resolves helpers and support objects by name:

```js
import { container } from 'codeceptjs'

const helpers = container.helpers()          // every helper, keyed by name
const { Playwright } = container.helpers()   // one helper
const support = container.support()          // every support object
const { UserPage } = container.support()     // one page object
const plugins = container.plugins()          // enabled plugins
const mocha = container.mocha()              // the current Mocha instance
```

Add objects at runtime — useful from a `bootstrap` script:

```js
import { container } from 'codeceptjs'
import UserPage from './pages/user.js'

container.append({
  helpers: { MyHelper: new MyHelper({ host: 'http://example.com' }) },
  support: { UserPage },
})
```

## Events

`event.dispatcher` is a Node `EventEmitter`. Attach listeners to it from a [plugin](/hooks#plugins) or `bootstrap` script.

Events are **sync** or **async**:

- **sync** — fires the moment the action happens. Do synchronous work only.
- **async** — fires when the action is *scheduled*. To do async work in the right order, queue it with `recorder.add()`.

| Event | Kind | When |
| --- | --- | --- |
| `event.all.before` | — | before any test runs |
| `event.suite.before(suite)` | async | before a suite |
| `event.test.started(test)` | sync | at the very start of a test |
| `event.test.before(test)` | async | after `Before` hooks from helpers and the test are run |
| `event.test.passed(test)` | sync | test passed |
| `event.test.failed(test, err)` | sync | test failed |
| `event.test.skipped(test)` | sync | test skipped |
| `event.test.after(test)` | async | after each test |
| `event.test.finished(test)` | sync | test finished |
| `event.suite.after(suite)` | async | after a suite |
| `event.step.before(step)` | async | step scheduled for execution |
| `event.step.started(step)` | sync | step starts executing |
| `event.step.passed(step)` | sync | step passed |
| `event.step.failed(step, err)` | sync | step failed |
| `event.step.after(step)` | async | after a step |
| `event.step.finished(step)` | sync | step finished |
| `event.step.comment(step)` | sync | a comment such as `I.say(...)` |
| `event.bddStep.before(step)` / `event.bddStep.after(step)` | async | around a Gherkin step |
| `event.hook.started(hook)` / `event.hook.passed` / `event.hook.failed` / `event.hook.finished` | sync | around `Before` / `After` / `BeforeSuite` / `AfterSuite` hooks |
| `event.all.after` | — | after all tests |
| `event.all.result(result)` | — | when results are printed |
| `event.all.failures(failures)` | — | when a run reports failures |
| `event.workers.before` / `event.workers.after` / `event.workers.result(result)` | — | around a [parallel run](/parallel) (parent process only) |

The [built-in listeners](https://github.com/codeceptjs/CodeceptJS/tree/master/lib/listener) are working examples — every reporter and several plugins are listeners.

### Test object

Test events pass a test object with these fields:

- `title` — the test title
- `body` — the test function as a string
- `opts` — test options such as `retries` (see [test options](/advanced#test-options))
- `pending` — `true` while scheduled, `false` once finished
- `tags` — array of [tags](/test-structure#tags) for this test
- `artifacts` — files attached to this test (screenshots, videos, …), shared across reporters
- `file` — path to the test file
- `steps` — executed steps (only on `test.passed`, `test.failed`, `test.finished`)
- `skipInfo` — present when the test was skipped: `{ message, description }`

### Step object

Step events pass a step object with these fields:

- `name` — the step name, such as `see` or `click`
- `actor` — the current actor, usually `I`
- `helper` — the helper instance that executes this step
- `helperMethod` — the helper method, usually the same as `name`
- `status` — `passed` or `failed`
- `prefix` — for a step inside a `within` block, the within text (e.g. `Within .js-signup-form`)
- `args` — the arguments passed to the step

## Config

```js
import { config } from 'codeceptjs'

config.get()                       // the full config object
config.get('myKey')                // one value
config.get('myKey', 'fallback')    // one value, with a default
```

## Output

Output has four verbosity levels, each toggled by a CLI flag:

| Level | Flag | Use |
| --- | --- | --- |
| default | — | `output.print` — basic information |
| steps | `--steps` | step execution |
| debug | `--debug` | steps plus `output.debug` |
| verbose | `--verbose` | debug plus `output.log` (internal logs and recorder activity) |

```js
import { output } from 'codeceptjs'

output.print('basic information')
output.debug('debug information')
output.log('verbose logging information')
```

Use these instead of `console.log` so messages respect the chosen verbosity.

## Store

`store` holds the state of the current run — the executing test, suite, and step, the active run modes (`dryRun`, `debugMode`, `workerMode`, …), and the project directories. Listeners, plugins, and helpers read it to know where in the [lifecycle](#events) they are without that information being passed to them:

```js
import { store } from 'codeceptjs'

event.dispatcher.on(event.step.before, () => {
  if (store.dryRun) return                    // no side effects on a dry run
  output.debug(`in ${store.currentTest?.title}`)
})
```

CodeceptJS keeps the state fields up to date for you. See the [Store reference](/store) for every field and when to write to it.

## Helpers and the Actor

The `I` object is an **actor** assembled from the enabled helpers. Each `I.method()` call delegates to the matching helper method and is wrapped as a step. Methods whose names start with `_` are private to the helper and not exposed on `I`. To add your own actions, write a [custom helper](/helpers).

## Running CodeceptJS from Code

CodeceptJS can be driven from your own script. Create the runner with a config and options, initialize it, then bootstrap, load tests, and run:

```js
import { codecept as Codecept } from 'codeceptjs'

const config = { helpers: { Playwright: { browser: 'chromium', url: 'http://localhost' } } }
const opts = { steps: true }

const codecept = new Codecept(config, opts)
codecept.init(import.meta.dirname)   // the test root directory

try {
  await codecept.bootstrap()
  codecept.loadTests('**/*_test.js')
  await codecept.run()               // pass a test file path to run only that file
} catch (err) {
  console.error(err)
  process.exitCode = 1
} finally {
  await codecept.teardown()
}
```

> To run tests inside workers from a script, see [parallel execution](/parallel).

---

**See also:** [Extending CodeceptJS](/hooks) · [Custom Helpers](/helpers) · [Plugins](/plugins) · [Bootstrap & Teardown](/bootstrap)
