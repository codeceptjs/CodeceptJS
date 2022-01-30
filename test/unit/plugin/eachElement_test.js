const path = require('path');
const { expect } = require('chai');
const container = require('../../../lib/container');
const eachElement = require('../../../lib/plugin/eachElement')();
const recorder = require('../../../lib/recorder');

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
