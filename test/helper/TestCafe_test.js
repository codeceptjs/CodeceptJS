const TestHelper = require('../support/TestHelper');
const TestCafe = require('../../lib/helper/TestCafe');
const path = require('path');
const webApiTests = require('./webapi');

let I;
const siteUrl = TestHelper.siteUrl();

describe('TestCafe', function () {
  this.timeout(35000);
  this.retries(1);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data');
    global.output_dir = path.join(__dirname, '/../data/output');

    I = new TestCafe({
      url: siteUrl,
      windowSize: '1000x700',
      show: false,
      browser: 'chrome',
      restart: false,
      waitForTimeout: 5000,
    });
    I._init();
    return I._beforeSuite();
  });

  after(() => {
    return I._finishTest();
  });

  beforeEach(() => {
    webApiTests.init({
      I, siteUrl,
    });
    return I._before().then(() => {
      page = I.page;
      browser = I.browser;
    });
  });

  afterEach(() => {
    return I._after();
  });

  describe('open page : #amOnPage', () => {
    it('should open main page of configured site', async () => {
      await I.amOnPage('/');
      const url = await I.grabCurrentUrl();
      await url.should.eql(`${siteUrl}/`);
    });
    it('should open any page of configured site', async () => {
      await I.amOnPage('/info');
      const url = await I.grabCurrentUrl();
      return url.should.eql(`${siteUrl}/info`);
    });

    it('should open absolute url', async () => {
      await I.amOnPage(siteUrl);
      const url = await I.grabCurrentUrl();
      return url.should.eql(`${siteUrl}/`);
    });
  });

  describe('#waitForFunction', () => {
    it('should wait for function returns true', () => {
      return I.amOnPage('/form/wait_js')
        .then(() => I.waitForFunction(() => window.__waitJs, 3));
    });

    it('should pass arguments and wait for function returns true', () => {
      return I.amOnPage('/form/wait_js')
        .then(() => I.waitForFunction(varName => window[varName], ['__waitJs'], 3));
    });
  });

  webApiTests.tests();
});
