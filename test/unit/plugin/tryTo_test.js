const expect = require('expect');
const tryTo = require('../../../lib/plugin/tryTo')();
const recorder = require('../../../lib/recorder');

describe('tryTo plugin', () => {
  beforeEach(() => {
    recorder.start();
  });

  it('should execute command on success', async () => {
    const ok = await tryTo(() => recorder.add(() => 5));
    expect(true).toEqual(ok);
    return recorder.promise();
  });

  it('should execute command on fail', async () => {
    const notOk = await tryTo(() => recorder.add(() => {
      throw new Error('Ups');
    }));
    expect(false).toEqual(notOk);
    return recorder.promise();
  });
});
