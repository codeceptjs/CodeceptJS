import { expect } from 'chai';
import { tryTo } from '../../../lib/plugin/tryTo.js';
import recorder from '../../../lib/recorder.js';

describe('tryTo plugin', () => {
  beforeEach(() => {
    recorder.reset();
    recorder.start();
  });

  it('should execute command on success', async () => {
    const ok = await tryTo(() => recorder.add('test', () => 5));
    expect(ok).to.true;
    return recorder.promise();
  });

  it('should execute command on fail', async () => {
    const notOk = await tryTo(() => recorder.add('test', () => {
      throw new Error('Ups');
    }));
    expect(false).is.equal(notOk);
    return recorder.promise();
  });
});
