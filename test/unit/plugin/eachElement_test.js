import path from 'path';

import { expect } from 'chai';
import container from '../../../lib/container.js';
const eachElement = lib();
import recorder from '../../../lib/recorder.js';

import lib from "../../../lib/plugin/eachElement.js";
const __dirname = path.resolve();

describe('eachElement plugin', () => {
  beforeEach(() => {
    global.codecept_dir = path.join(__dirname, '/../..');
    recorder.start();
    container.create({
      helpers: {
        MyHelper: {
          require: './data/helper',
        },
      },
    });
  });

  afterEach(() => {
    container.clear();
  });

  it('should iterate for each elements', async () => {
    let counter = 0;
    await eachElement('some action', 'some locator', async (el) => {
      expect(el).is.not.null;
      counter++;
    });
    await recorder.promise();
    expect(counter).to.equal(2);
  });

  it('should not allow non async function', async () => {
    let errorCaught = false;
    try {
      await eachElement('some action', 'some locator', (el) => {});
      await recorder.promise();
    } catch (err) {
      errorCaught = true;
      expect(err.message).to.include('Async');
    }
    expect(errorCaught).is.true;
  });
});
