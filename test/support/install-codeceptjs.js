import Helper from '@codeceptjs/helper'
import Config from '../../lib/config.js'
import container from '../../lib/container.js'
import event from '../../lib/event.js'
import output from '../../lib/output.js'
import recorder from '../../lib/recorder.js'

// Install the in-process handle that companion packages
// (@codeceptjs/configure, @codeceptjs/expect-helper, @codeceptjs/helper)
// read at runtime. Each test suite calls this from its own bootstrap:
// mocha-driven tests via .mocharc → test/support/setup.mjs;
// codeceptjs-runner-driven acceptance suites via the `bootstrap` field.
export default function installCodeceptjs() {
  if (globalThis.codeceptjs) return
  globalThis.codeceptjs = { config: Config, container, event, output, recorder, Helper }
}
