const expect = require('expect');
const retryTo = require('../../../lib/plugin/retryTo')();
const recorder = require('../../../lib/recorder');

describe('retryTo plugin', () => {
  beforeEach(() => {
    recorder.start();
  });

  it('should execute command on success', async () => {
    let counter = 0;
    await retryTo(() => recorder.add(() => counter++), 5);
    expect(counter).toEqual(1);
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
      expect(err.message).toEqual('Ups');
    }
    expect(counter).toEqual(5);
    expect(errorCaught).toBeTruthy();
  });
});
