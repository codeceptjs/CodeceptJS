const Detox = require('../../lib/helper/Detox');
const path = require('path');
const assert = require('assert');

const apk_path = path.join(__dirname, '../data/app-release.apk');
const test_apk_path = path.join(__dirname, '../data/app-release-androidTest.apk');

let I;


describe('Detox', function () {
  // this.retries(1);
  this.timeout(0);

  before(() => {
    I = new Detox({
      binaryPath: apk_path,
      testBinaryPath: test_apk_path,
      type: 'android.emulator',
      name: 'Nexus_5X_API_26',
      reloadReactNative: true,
    });
    return I._beforeSuite();
  });

  beforeEach(async () => {
    await I._before();
  });

  afterEach(() => I._after());

  describe('#seeElement', () => {
    it('should have welcome screen #1', async () => {
      I.seeElement('#welcome');
      I.seeElement({ id: 'welcome' });
    });
  });

  describe('#see', () => {
    it('should see welcome screen', async () => {
      await I.see('Welcome');
    });
  });

  describe('#click', () => {
    it('should show hello screen after tap', async () => {
      await I.click('#hello_button');
      await I.see('Hello!!!');
    });

    it('should show world screen after tap', async () => {
      await I.click('#world_button');
      await I.see('World!!!');
    });
  });

  xdescribe('#wait', () => {
    beforeEach(async () => {
      await I.click('WaitFor');
    });

    it('should wait until an element is created and exists in layout', async () => {
      await I.dontSeeElement('#createdAndVisibleText');
      await I.click('#GoButton');
      await I.waitForElement('#createdAndVisibleText', 20);
      await I.seeElement('#createdAndVisibleText');
    });

    it('should wait until an element is removed', async () => {
      await expect(element(by.id('deletedFromHierarchyText'))).toBeVisible();
      await element(by.id('GoButton')).tap();
      await waitFor(element(by.id('deletedFromHierarchyText'))).toBeNotVisible().withTimeout(20000);
      await expect(element(by.id('deletedFromHierarchyText'))).toBeNotVisible();
    });

    custom.it.withFailureIf.android.rn58OrNewer('should find element by scrolling until it is visible', async () => {
      await expect(element(by.text('Text5'))).toBeNotVisible();
      await element(by.id('GoButton')).tap();
      await waitFor(element(by.text('Text5'))).toBeVisible().whileElement(by.id('ScrollView')).scroll(50, 'down');
      await expect(element(by.text('Text5'))).toBeVisible();
    });
  });
});
