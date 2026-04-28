import Helper from '@codeceptjs/helper'
import Config from './config.js'
import container from './container.js'
import event from './event.js'
import output from './output.js'
import recorder from './recorder.js'

// Register an in-process handle on globalThis so companion packages
// (@codeceptjs/helper, @codeceptjs/configure, @codeceptjs/expect-helper) can
// reach back into the running codeceptjs instance without doing a top-level
// `import 'codeceptjs'`. End-user projects don't need this — `codeceptjs` is
// in their node_modules and the bare-specifier import resolves normally — but
// inside this repo's CI the project IS the codeceptjs package and there is
// no node_modules/codeceptjs to resolve to.
if (!globalThis.codeceptjs) {
  globalThis.codeceptjs = { config: Config, container, event, output, recorder, Helper }
}

export default globalThis.codeceptjs
