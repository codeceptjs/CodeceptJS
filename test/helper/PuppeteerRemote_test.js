const assert = require('assert');
const path = require('path');
const puppeteer = require('puppeteer');
const Puppeteer = require('../../lib/helper/Puppeteer');
const TestHelper = require('../support/TestHelper');

const siteUrl = TestHelper.siteUrl();
const helperConfig = {
  chrome: {
    browserWSEndpoint: 'ws://localhost:9222/devtools/browser/<id>',
    // Following options are ignored with remote browser
    headless: false,
    devtools: true,
  },
  // Important in order to handle remote browser state before starting/stopping browser
  manualStart: true,
  url: siteUrl,
  waitForTimeout: 5000,
  waitForAction: 500,
  windowSize: '500x700',
};

let I;
let remoteBrowser;
async function createRemoteBrowser() {
  if (remoteBrowser) {
    await remoteBrowser.close();
  }
  remoteBrowser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });
  remoteBrowser.on('disconnected', () => {
    remoteBrowser = null;
  });
  return remoteBrowser;
}

describe('Puppeteer (remote browser)', function () {
  this.timeout(35000);
  this.retries(1);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    I = new Puppeteer(helperConfig);
    I._init();
    return I._beforeSuite();
  });

  beforeEach(async () => {
    // Mimick remote session by creating another browser instance
    await createRemoteBrowser();
    // Set websocket endpoint to other browser instance
    helperConfig.chrome.browserWSEndpoint = await remoteBrowser.wsEndpoint();
    I._setConfig(helperConfig);

    return I._before();
  });

  afterEach(() => {
    return I._after()
      .then(() => {
        remoteBrowser && remoteBrowser.close();
      });
  });

  describe('#_startBrowser', () => {
    it('should throw an exception when endpoint is unreachable', async () => {
      helperConfig.chrome.browserWSEndpoint = 'ws://unreachable/';
      I._setConfig(helperConfig);
      try {
        await I._startBrowser();
        throw Error('It should never get this far');
      } catch (e) {
        e.message.should.include('Cannot connect to websocket endpoint.\n\nPlease make sure remote browser is running and accessible.');
      }
    });

    it('should throw an exception when connection was lost', async () => {
      await I._startBrowser();
      try {
        await I.browser.disconnect();
        throw Error('It should never get this far');
      } catch (e) {
        e.message.should.include('Connection with remote browser was lost.');
      }
    });

    it('should clear any prior existing pages on remote browser', async () => {
      const remotePages = await remoteBrowser.pages();
      assert.equal(remotePages.length, 1);
      for (let p = 1; p < 10; p++) {
        await remoteBrowser.newPage();
      }
      const existingPages = await remoteBrowser.pages();
      assert.equal(existingPages.length, 10);

      await I._startBrowser();
      // Session was cleared
      let currentPages = await remoteBrowser.pages();
      assert.equal(currentPages.length, 1);

      let numPages = await I.grabNumberOfOpenTabs();
      assert.equal(numPages, 1);

      await I.openNewTab();

      numPages = await I.grabNumberOfOpenTabs();
      assert.equal(numPages, 2);

      await I._stopBrowser();

      currentPages = await remoteBrowser.pages();
      assert.equal(currentPages.length, 2);
    });
  });
});
