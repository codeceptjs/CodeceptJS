---
permalink: /store
title: Store
---

# Store

`store` is a global object that holds the state of the current run — which test and step are executing, which modes are enabled, and where the project lives on disk. Listeners, plugins, and helpers read it to find out *where in the lifecycle* they are without threading that information through every call.

```js
import { store } from 'codeceptjs'

event.dispatcher.on(event.step.before, () => {
  if (store.dryRun) return            // skip side effects on a dry run
  console.log(`running ${store.currentTest?.title}`)
})
```

It is a single shared object for the whole process. Read from it freely; write to it only if you are deliberately driving execution state (see [Writing to the store](#writing-to-the-store)).

## Fields

### Required

Set once when the runner starts and immutable afterwards. Resolved from the test root, falling back to the legacy `global.codecept_dir` / `global.output_dir`.

| Field | Type | What it is |
| --- | --- | --- |
| `store.codeceptDir` | `string` | root directory of the tests |
| `store.outputDir` | `string` | resolved output directory for artifacts |
| `store.workerMode` | `boolean` | `true` when running inside a [parallel](/parallel) worker |

### Session config

Set at session start and stable for that session. They reflect how the run was invoked.

| Field | Type | What it is |
| --- | --- | --- |
| `store.debugMode` | `boolean` | run started with `--debug` |
| `store.timeouts` | `boolean` | [timeouts](/timeouts) are enabled |
| `store.autoRetries` | `boolean` | step auto-retries are active (the `tryTo` [effect](/effects) turns this off while it runs) |
| `store.dryRun` | `boolean` | run is a `--dry-run`; steps must not cause side effects |
| `store.featureOnly` | `boolean` | a `Feature.only()` was used |
| `store.scenarioOnly` | `boolean` | a `Scenario.only()` was used |
| `store.maskSensitiveData` | `boolean \| object` | mask [secret](/secrets) values in output |
| `store.noGlobals` | `boolean` | `noGlobals` mode — the user imports everything instead of relying on globals |

### State

Changes constantly as the run progresses. The most useful fields for plugins and listeners:

| Field | Type | What it is |
| --- | --- | --- |
| `store.onPause` | `boolean` | execution is paused inside [`pause()`](/basics#pause) |
| `store.currentTest` | `Test \| null` | the running test, or `null` between tests |
| `store.currentStep` | `Step \| null` | the running step, or `null` |
| `store.currentSuite` | `Suite \| null` | the running suite, or `null` between suites |
| `store.tsFileMapping` | `Map \| null` | TypeScript source-map lookup, when running `.ts` tests |

`currentTest`, `currentStep`, and `currentSuite` carry the same objects passed to lifecycle events — see the [test and step object](/architecture#test-object) fields.

## Reading the store

A typical use is gating expensive or unsafe work by run mode:

```js
import { store, recorder } from 'codeceptjs'

event.dispatcher.on(event.test.before, () => {
  if (store.dryRun || store.workerMode) return

  recorder.add('seed fixture data', async () => {
    await api.post('/users', { name: 'john' })
  })
})
```

`store.currentTest` is the simplest way to attach context to the current test from anywhere — for example tagging an artifact:

```js
import { store } from 'codeceptjs'

store.currentTest?.artifacts.push({ name: 'log', path: '/tmp/run.log' })
```

## Writing to the store

CodeceptJS keeps the state fields current for you — the built-in [`store` listener](https://github.com/codeceptjs/CodeceptJS/blob/master/lib/listener/store.js) sets `currentSuite` and `currentTest` around each suite and test. You rarely need to write to it.

Write only when you are deliberately driving execution — for example, a tool that opens `pause()` sets `store.onPause`. The required fields (`codeceptDir`, `outputDir`) are locked after `store.initialize()` and cannot be reassigned.

---

**See also:** [Architecture](/architecture) · [Extending CodeceptJS](/hooks) · [Events](/architecture#events)
