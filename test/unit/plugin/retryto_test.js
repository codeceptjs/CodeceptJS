const { expect } = require('chai');
const retryTo = require('../../../lib/plugin/retryTo')();
const recorder = require('../../../lib/recorder');

describe('retryTo plugin', () => {
  beforeEach(() => {
    recorder.start();
  });

  it('should execute command on success', async () => {
    let counter = 0;
    await retryTo(() => recorder.add(() => counter++), 5);
    expect(counter).is.equal(1);
    return recorder.promise();
  });

  it('should execute few times command on fail', async () => {
    let counter = 0;
    let errorCaught = false;
    await retryTo(() => {
      recorder.add(() => counter++);
      recorder.add(() => { throw new Error('Ups'); });
    }, 5, 10);
    try {
      await recorder.promise();
    } catch (err) {
      errorCaught = true;
      expect(err.message).to.eql('Ups');
    }
    expect(counter).to.equal(5);
    expect(errorCaught).is.true;
  });
});
