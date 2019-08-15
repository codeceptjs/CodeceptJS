const Helper = require('../../../lib/helper');
const output = require('../../../lib/output');
const Step = require('../../../lib/step');
const { Worker, isMainThread } = require('worker_threads');
const assert = require('assert');

class Workers extends Helper {
  seeThisIsWorker() {
    assert(!isMainThread, 'this is running inside worker');
  }
}

module.exports = Workers;
