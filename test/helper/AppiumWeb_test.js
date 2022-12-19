const Appium = require('../../lib/helper/Appium');

let I;
const site_url = 'http://davertmik.github.io';

describe('Appium Web', function () {
  this.retries(4);
  this.timeout(70000);

  before(() => {
    I = new Appium({
      url: site_url,
      browser: 'chrome',
      restart: false,
      desiredCapabilities: {
        appiumVersion: '1.6.5',
        recordVideo: 'false',
        recordScreenshots: 'false',
        platformName: 'Android',
        platformVersion: '6.0',
        deviceName: 'Android Emulator',
      },
      host: 'ondemand.saucelabs.com',
      port: 80,
      // port: 4723,
      // host: 'localhost',
      user: process.env.SAUCE_USERNAME,
      key: process.env.SAUCE_ACCESS_KEY,
    });
    // I.isWeb = true;
    I._init();
    I._beforeSuite();
  });

  after(() => I._finishTest());

  beforeEach(() => {
    I.isWeb = true;
    return I._before();
  });

  afterEach(() => I._after());

  describe('current url : #seeInCurrentUrl, #seeCurrentUrlEquals, ...', () => {
    it('should check for url fragment', async () => {
      await I.amOnPage('/angular-demo-app/#/info');
      await I.seeInCurrentUrl('/info');
      await I.dontSeeInCurrentUrl('/result');
    });

    it('should check for equality', async () => {
      await I.amOnPage('/angular-demo-app/#/info');
      await I.seeCurrentUrlEquals('/angular-demo-app/#/info');
      await I.dontSeeCurrentUrlEquals('/angular-demo-app/#/result');
    });
  });

  describe('see text : #see', () => {
    it('should check text on site', async () => {
      await I.amOnPage('/angular-demo-app/');
      await I.see('Description');
      await I.dontSee('Create Event Today');
    });

    it('should check text inside element', async () => {
      await I.amOnPage('/angular-demo-app/#/info');
      await I.see('About', 'h1');
      await I.see('Welcome to event app', { css: 'p.jumbotron' });
      await I.see('Back to form', '//div/a');
    });
  });

  describe('see element : #seeElement, #dontSeeElement', () => {
    it('should check visible elements on page', async () => {
      await I.amOnPage('/angular-demo-app/');
      await I.seeElement('.btn.btn-primary');
      await I.seeElement({ css: '.btn.btn-primary' });
      await I.dontSeeElement({ css: '.btn.btn-secondary' });
    });
  });

  describe('#click', () => {
    it('should click by text', async () => {
      await I.amOnPage('/angular-demo-app/');
      await I.dontSeeInCurrentUrl('/info');
      await I.click('Get more info!');
      await I.seeInCurrentUrl('/info');
    });

    it('should click by css', async () => {
      await I.amOnPage('/angular-demo-app/');
      await I.click('.btn-primary');
      await I.wait(2);
      await I.seeInCurrentUrl('/result');
    });

    it('should click by non-optimal css', async () => {
      await I.amOnPage('/angular-demo-app/');
      await I.click('form a.btn');
      await I.wait(2);
      await I.seeInCurrentUrl('/result');
    });

    it('should click by xpath', async () => {
      await I.amOnPage('/angular-demo-app/');
      await I.click('//a[contains(., "more info")]');
      await I.seeInCurrentUrl('/info');
    });

    it('should click on context', async () => {
      await I.amOnPage('/angular-demo-app/');
      await I.click('.btn-primary', 'form');
      await I.wait(2);
      await I.seeInCurrentUrl('/result');
    });

    it('should click link with inner span', async () => {
      await I.amOnPage('/angular-demo-app/#/result');
      await I.click('Go to info');
      await I.seeInCurrentUrl('/info');
    });

    it('should click buttons as links', async () => {
      await I.amOnPage('/angular-demo-app/');
      await I.click('Options');
      await I.seeInCurrentUrl('/options');
    });
  });

  describe('#grabTextFrom, #grabValueFrom, #grabAttributeFrom', () => {
    it('should grab text from page', async () => {
      await I.amOnPage('/angular-demo-app/#/info');
      const val = await I.grabTextFrom('p.jumbotron');
      val.should.be.toEqual('Welcome to event app');
    });

    it('should grab value from field', async () => {
      await I.amOnPage('/angular-demo-app/#/options');
      const val = await I.grabValueFrom('#ssh');
      val.should.be.toEqual('PUBLIC-SSH-KEY');
    });

    it('should grab attribute from element', async () => {
      await I.amOnPage('/angular-demo-app/#/info');
      const val = await I.grabAttributeFrom('a.btn', 'ng-href');
      val.should.be.toEqual('#/');
    });
  });

  describe('#within', () => {
    afterEach(() => I._withinEnd());

    it('should work using within operator', async () => {
      await I.amOnPage('/angular-demo-app/#/options');
      await I.see('Choose if you ok with terms');
      await I._withinBegin({ css: 'div.results' });
      await I.see('SSH Public Key: PUBLIC-SSH-KEY');
      await I.dontSee('Options');
    });
  });
});
