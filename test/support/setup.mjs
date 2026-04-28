import * as chai from 'chai'
chai.should()

// Install the framework registry the same way the runner does in lib/codecept.js.
// Unit tests import lib/* modules directly (bypassing the runner), so without
// this companion packages reaching for `globalThis.codeceptjs` (e.g.
// @codeceptjs/configure inside the browser plugin) get an undefined handle.
import Helper from '@codeceptjs/helper'
import Config from '../../lib/config.js'
import container from '../../lib/container.js'
import event from '../../lib/event.js'
import output from '../../lib/output.js'
import recorder from '../../lib/recorder.js'

if (!globalThis.codeceptjs) {
  globalThis.codeceptjs = { config: Config, container, event, output, recorder, Helper }
}
