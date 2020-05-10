const assert = require('assert');
const tryTo = require('../../../lib/plugin/tryTo')();
const recorder = require('../../../lib/recorder');

describe('retryFailedStep', () => {
  beforeEach(() => {
    recorder.start();
  });

  it('should execute command on success', async () => {
    const ok = await tryTo(() => recorder.add(() => 5));
    assert.equal(true, ok);
    return recorder.promise();
  });

  it('should execute command on fail', async () => {
    const notOk = await tryTo(() => recorder.add(() => {
      throw new Error('Ups');
    }));
    assert.equal(false, notOk);
    return recorder.promise();
  });
});
