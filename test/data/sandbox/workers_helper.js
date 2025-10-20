const assert = require('assert');
const { isMainThread } = require('worker_threads');

const Helper = require('@codeceptjs/helper');

class Workers extends Helper {
  seeThisIsWorker() {
    assert(!isMainThread, 'this is running inside worker');
  }
}

module.exports = Workers;
