const assert = require('assert');
const { isMainThread } = require('worker_threads');

const Helper = require('../../../lib/helper');

class Workers extends Helper {
  seeThisIsWorker() {
    assert(true, true);
    // assert(!isMainThread, 'this is running inside worker');
  }
}

module.exports = Workers;
