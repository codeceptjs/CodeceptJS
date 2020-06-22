const assert = require('assert');
const { Worker, isMainThread } = require('worker_threads');

const Helper = require('../../../lib/helper');
const output = require('../../../lib/output');
const Step = require('../../../lib/step');

class Workers extends Helper {
  seeThisIsWorker() {
    assert(!isMainThread, 'this is running inside worker');
  }
}

module.exports = Workers;
