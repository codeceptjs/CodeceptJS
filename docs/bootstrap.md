---
permalink: /bootstrap
title: Bootstrap
---

# Bootstrap

In case you need to execute arbitrary code before or after the tests,
you can use the `bootstrap` and `teardown` config. Use it to start and stop a webserver, seed a database, etc.

When using the [parallel execution](/parallel) mode, there are two additional hooks available; `bootstrapAll` and `teardownAll`. See [bootstrapAll & teardownAll](#bootstrapall-teardownall) for more information.


### Example: Bootstrap & Teardown

If you are using JavaScript-style config `codecept.conf.js`, bootstrap and teardown functions can be placed inside of it:

```js
import server from './app_server.js';

export default {
  tests: "./*_test.js",
  helpers: {},

  // adding bootstrap/teardown
  async bootstrap() {
    await server.launch();
  },
  async teardown() {
    await server.stop();
  }
  // ...
  // other config options
}

```

## BootstrapAll & TeardownAll

There are two additional hooks for [parallel execution](/parallel) in `run-multiple` or `run-workers` commands.

These hooks are only called in the parent process. Before child processes start (`bootstrapAll`) and after all of runs have finished (`teardownAll`). Each worker process will call `bootstrap` & `teardown` in their own process.

For example, when you run tests in 2 workers using the following command:

```
npx codeceptjs run-workers 2
```

First, `bootstrapAll` is called. Then two `bootstrap` runs in each of workers. Then tests in worker #1 ends and `teardown` is called. Same for worker #2. Finally, `teardownAll` runs in the main process.

> The same behavior is set for `run-multiple` command

The `bootstrapAll` and `teardownAll` hooks are preferred to use for setting up common logic of tested project: to start the application server or database or to start webdriver's grid.

The `bootstrap` and `teardown` hooks are used for setting up each testing browser: to create unique [cloud testing server](/helpers/WebDriver#cloud-providers) connection or to create specific browser-related test data in database (like users with names with browsername in it).

### Example: BootstrapAll & TeardownAll Inside Config

Using JavaScript-style config `codecept.conf.js`, bootstrapAll and teardownAll functions can be placed inside of it:


```js
import fs from 'fs';
const tempFolder = process.cwd() + '/tmpFolder';

export default {
  tests: "./*_test.js",
  helpers: {},

  // adding bootstrapAll/teardownAll
  async bootstrapAll() {
    fs.mkdirSync(tempFolder);
  },

  async bootstrap() {
    console.log('Do some pretty suite setup stuff');
  },

  async teardown() {
    console.log('Cool, one of the workers have finished');
  },

  async teardownAll() {
    console.log('All workers have finished running tests so we should clean up the temp folder');
    fs.rmdirSync(tempFolder);
  },

  // ...
  // other config options
}
```

## Combining Bootstrap & BootstrapAll

It is quite common that you expect that bootstrapAll and bootstrap will do the same thing. If an application server is already started in `bootstrapAll` we should not run it again inside `bootstrap` for each worker. To avoid code duplication we can run bootstrap script only when we are not inside a worker. CodeceptJS provides `store.workerMode` to detect if code is running in a worker process:

```js
// inside codecept.conf.js

import store from 'codeceptjs/lib/store.js';

async function startServer() {
  // implement starting server logic here
}
async function stopServer() {
  // and stop server too
}


export default {
  // codeceptjs config goes here

  async bootstrapAll() {
    await startServer();
  },
  async bootstrap() {
    // start a server only if we are not in worker
    if (!store.workerMode) return startServer();
  }

  async teardown() {
    // stop a server only if we are not in worker
    if (!store.workerMode) return stopServer();
  }

  async teardownAll() {
    await stopServer();
  },
}

```
