const assert = require('assert');
const path = require('path');

const Appium = require('../../lib/helper/Appium');
const AssertionFailedError = require('../../lib/assert/error');
const fileExists = require('../../lib/utils').fileExists;
global.codeceptjs = require('../../lib');

let app;
// iOS test app is built from https://github.com/appium/ios-test-app and uploaded to Saucelabs
const apk_path = 'storage:filename=TestApp-iphonesimulator.zip';
const smallWait = 3;

describe('Appium iOS Tests', function () {
  this.timeout(0);

  before(async () => {
    global.codecept_dir = path.join(__dirname, '/../data');
    app = new Appium({
      app: apk_path,
      appiumV2: true,
      desiredCapabilities: {
        'sauce:options': {
          appiumVersion: '2.0.0',
        },
        browserName: '',
        recordVideo: 'false',
        recordScreenshots: 'false',
        platformName: 'iOS',
        platformVersion: '12.2',
        deviceName: 'iPhone 8 Simulator',
        androidInstallTimeout: 90000,
        appWaitDuration: 300000,
      },
      restart: true,
      protocol: 'http',
      host: 'ondemand.saucelabs.com',
      port: 80,
      user: process.env.SAUCE_USERNAME,
      key: process.env.SAUCE_ACCESS_KEY,
    });
    await app._beforeSuite();
    app.isWeb = false;
    await app._before();
  });

  after(async () => {
    await app._after();
  });

  describe('app installation : #removeApp', () => {
    describe(
      '#grabAllContexts, #grabContext, #grabOrientation, #grabSettings',
      () => {
        it('should grab all available contexts for screen', async () => {
          await app.resetApp();
          const val = await app.grabAllContexts();
          assert.deepEqual(val, ['NATIVE_APP']);
        });

        it('should grab current context', async () => {
          const val = await app.grabContext();
          assert.equal(val, 'NATIVE_APP');
        });

        it('should grab custom settings', async () => {
          const val = await app.grabSettings();
          assert.deepEqual(val, { imageElementTapStrategy: 'w3cActions' });
        });
      },
    );
  });

  describe('device orientation : #seeOrientationIs #setOrientation', () => {
    it('should return correct status about device orientation', async () => {
      await app.seeOrientationIs('PORTRAIT');
      try {
        await app.seeOrientationIs('LANDSCAPE');
      } catch (e) {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include('expected orientation to be LANDSCAPE');
      }
    });
  });

  describe('#hideDeviceKeyboard', () => {
    it('should hide device Keyboard @quick', async () => {
      await app.resetApp();
      await app.click('~IntegerA');
      try {
        await app.click('~locationStatus');
      } catch (e) {
        e.message.should.include('element');
      }
      await app.hideDeviceKeyboard('pressKey', 'Done');
      await app.click('~locationStatus');
    });

    it('should assert if no keyboard', async () => {
      try {
        await app.hideDeviceKeyboard('pressKey', 'Done');
      } catch (e) {
        e.message.should.include('An unknown server-side error occurred while processing the command. Original error: Soft keyboard not present, cannot hide keyboard');
      }
    });
  });

  describe('see text : #see', () => {
    it('should work inside elements @second', async () => {
      await app.resetApp();
      await app.see('Compute Sum', '~ComputeSumButton');
    });
  });

  describe('#appendField', () => {
    it('should be able to send special keys to element @second', async () => {
      await app.resetApp();
      await app.waitForElement('~IntegerA', smallWait);
      await app.click('~IntegerA');
      await app.appendField('~IntegerA', '1');
      await app.hideDeviceKeyboard('pressKey', 'Done');
      await app.see('1', '~IntegerA');
    });
  });

  describe('#waitForText', () => {
    it('should return error if not present', async () => {
      try {
        await app.waitForText('Nothing here', 1, '~IntegerA');
      } catch (e) {
        e.message.should.contain('element (~IntegerA) is not in DOM or there is no element(~IntegerA) with text "Nothing here" after 1 sec');
      }
    });
  });

  describe('#seeNumberOfElements @second', () => {
    it('should return 1 as count', async () => {
      await app.resetApp();
      await app.seeNumberOfElements('~IntegerA', 1);
    });
  });

  describe('see element : #seeElement, #dontSeeElement', () => {
    it('should check visible elements on page @quick', async () => {
      await app.resetApp();
      await app.seeElement('~IntegerA');
      await app.dontSeeElement('#something-beyond');
      await app.dontSeeElement('//input[@id="something-beyond"]');
    });
  });

  describe('#click @quick', () => {
    it('should click by accessibility id', async () => {
      await app.resetApp();
      await app.tap('~ComputeSumButton');
      await app.see('0');
    });
  });

  describe('#fillField @second', () => {
    it('should fill field by accessibility id', async () => {
      await app.resetApp();
      await app.waitForElement('~IntegerA', smallWait);
      await app.click('~IntegerA');
      await app.fillField('~IntegerA', '1');
      await app.hideDeviceKeyboard('pressKey', 'Done');
      await app.see('1', '~IntegerA');
    });
  });

  describe('#grabTextFrom, #grabValueFrom, #grabAttributeFrom @quick', () => {
    it('should grab text from page', async () => {
      await app.resetApp();
      const val = await app.grabTextFrom('~ComputeSumButton');
      assert.equal(val, 'Compute Sum');
    });

    it('should grab attribute from element', async () => {
      await app.resetApp();
      const val = await app.grabAttributeFrom('~ComputeSumButton', 'label');
      assert.equal(val, 'Compute Sum');
    });

    it('should be able to grab elements', async () => {
      await app.resetApp();
      const id = await app.grabNumberOfVisibleElements('~ComputeSumButton');
      assert.strictEqual(1, id);
    });
  });

  describe('#saveScreenshot', () => {
    beforeEach(() => {
      global.output_dir = path.join(global.codecept_dir, 'output');
    });

    it('should create a screenshot file in output dir', async () => {
      const sec = (new Date()).getUTCMilliseconds();
      await app.saveScreenshot(`screenshot_${sec}.png`);
      assert.ok(fileExists(path.join(global.output_dir, `screenshot_${sec}.png`)), null, 'file does not exists');
    });
  });
});
