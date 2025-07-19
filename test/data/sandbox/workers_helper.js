const assert = require('assert')
const { isMainThread } = require('worker_threads')

const HelperModule = require('@codeceptjs/helper')
const Helper = HelperModule.default || HelperModule

class Workers extends Helper {
  seeThisIsWorker() {
    assert(!isMainThread, 'this is running inside worker')
  }
}

module.exports = Workers
