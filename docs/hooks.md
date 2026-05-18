---
permalink: /hooks
title: Extending CodeceptJS
---

# Extending CodeceptJS

CodeceptJS has four extension points. Pick the lightest one that does the job:

| Use | To |
| --- | --- |
| [`bootstrap` / `teardown`](/bootstrap) | run setup or teardown code once, around the whole suite |
| [Event listeners](#event-listeners) | react to test, suite, or step events without packaging anything |
| [Plugins](#plugins) | bundle reusable behavior — listeners, recorder hooks, config — into a module |
| [Custom helpers](/helpers) | add new `I.*` actions backed by a browser or an HTTP library |

Listeners and plugins use CodeceptJS internals — the `event` dispatcher, the `recorder` promise chain, the `container`, `output`. See [Architecture](/architecture) for what those are and how a test runs.

## Event Listeners

Attach a listener to `event.dispatcher` to run code at any point in the [test lifecycle](/architecture#events). A listener can live in a [plugin](#plugins) or in your [`bootstrap`](/bootstrap) script.

```js
import { event } from 'codeceptjs'

event.dispatcher.on(event.test.before, test => {
  console.log(`starting ${test.title}`)
})
```

[Sync events](/architecture#events) run inline. For async work, queue it on the recorder so it runs in order with the test's steps:

```js
import { event, recorder } from 'codeceptjs'

event.dispatcher.on(event.test.before, () => {
  recorder.add('seed fixture data', async () => {
    await api.post('/users', { name: 'john', email: 'john@example.com' })
  })
})
```

A listener often needs to know *where* in the run it is — which test is active, or whether this is a dry run. Read that from [`store`](/store) instead of tracking it yourself:

```js
import { event, store } from 'codeceptjs'

event.dispatcher.on(event.step.before, () => {
  if (store.dryRun) return            // skip side effects on a dry run
})
```

See [Architecture › Events](/architecture#events) for the full event list and the test and step object fields, and the [Store reference](/store) for every state field.

## Plugins

A plugin packages listeners, recorder hooks, container changes, and config into one module. CodeceptJS ships [built-in plugins](/plugins) — [their source](https://github.com/codeceptjs/CodeceptJS/tree/master/lib/plugin) doubles as example code.

A plugin is a module that exports a function. CodeceptJS calls it once at startup with the plugin's config:

```js
import { event } from 'codeceptjs'

const defaultConfig = {
  someOption: true,
}

export default function (config) {
  config = { ...defaultConfig, ...config }

  event.dispatcher.on(event.test.before, test => {
    // use config, register listeners, hook into the recorder
  })
}
```

### Enabling a plugin

Add it to the `plugins` section of the config and point `require` at the module:

```js
plugins: {
  myPlugin: {
    require: './path/to/plugin',   // relative to the config file
    enabled: true,
  }
}
```

- `require` — path to the plugin file, relative to the config file.
- `enabled` — set `true` to load it.
- any other key is passed straight to the plugin function as config.

A disabled or unlisted plugin can be turned on for a single run from the command line:

```
npx codeceptjs run --plugin myPlugin
npx codeceptjs run --plugin myPlugin,allure
```

### Example: run code for a tagged group of tests

[Tag](/test-structure#tags) the tests you want to target, then check the tag on `event.test.before`:

```js
import { event, recorder } from 'codeceptjs'

export default function () {
  event.dispatcher.on(event.test.before, test => {
    if (!test.tags.includes('@populate')) return

    recorder.add('populate database', async () => {
      // seed data for this test
    })
  })
}
```

### Example: run async setup before all tests

`event.all.before` can fire before the recorder chain is running, so start it first:

```js
import { event, recorder } from 'codeceptjs'

export default function () {
  event.dispatcher.on(event.all.before, () => {
    recorder.startUnlessRunning()
    recorder.add('warm up cache', async () => {
      // your async setup
    })
  })
}
```

Wrapping bootstrap logic in a plugin like this lets you share it across projects and combine several setup scripts.

## Custom Helpers

To add new `I.*` actions — a higher-level step, a wrapper around a browser SDK, an assertion against your backend — write a helper class. Helpers can also be published as npm packages. See [Custom Helpers](/helpers).

## Bootstrap & Teardown

For setup and teardown that needs no packaging — start a server, create a database — use the `bootstrap` and `teardown` config hooks. In [parallel runs](/parallel), `bootstrapAll` / `teardownAll` run once in the parent process. See [Bootstrap & Teardown](/bootstrap).

---

**See also:** [Architecture](/architecture) · [Plugins reference](/plugins) · [Custom Helpers](/helpers) · [Bootstrap & Teardown](/bootstrap)
