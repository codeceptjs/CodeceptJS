import lib from "../../../lib/plugin/tryTo.js";

import { expect } from 'chai';
const tryTo = lib();
import recorder from '../../../lib/recorder.js';

describe('tryTo plugin', () => {
  beforeEach(() => {
    recorder.start();
  });

  it('should execute command on success', async () => {
    const ok = await tryTo(() => recorder.add(() => 5));
    expect(true).is.equal(ok);
    return recorder.promise();
  });

  it('should execute command on fail', async () => {
    const notOk = await tryTo(() => recorder.add(() => {
      throw new Error('Ups');
    }));
    expect(false).is.equal(notOk);
    return recorder.promise();
  });
});
