const Protractor = require('../../lib/helper/Protractor');
const TestHelper = require('../support/TestHelper');
const assert = require('assert');
const path = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const AssertionFailedError = require('../../lib/assert/error');
const formContents = require('../../lib/utils').test.submittedData(path.join(__dirname, '/../data/app/db'));
const fileExists = require('../../lib/utils').fileExists;

const web_app_url = TestHelper.siteUrl();
const siteUrl = TestHelper.angularSiteUrl();
let I;
let browser;

chai.use(chaiAsPromised);
const expect = chai.expect;

require('co-mocha')(require('mocha'));

function assertFormContains(key, value) {
  return browser.element(global.by.id('data')).getText().then(text => expect(JSON.parse(text)).to.have.deep.property(key, value));
}

describe('Protractor', function () {
  this.retries(3);
  this.timeout(20000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '../data');
    I = new Protractor({
      url: siteUrl,
      browser: 'chrome',
      seleniumAddress: TestHelper.seleniumAddress(),
      angular: true,
      waitForTimeout: 5000,
      getPageTimeout: 120000,
      allScriptsTimeout: 30000,
      capabilities: {
        chromeOptions: {
          args: ['--headless', '--disable-gpu', '--window-size=1280,1024'],
        },
      },
    });
    return I._init().then(() => I._beforeSuite());
  });

  after(() => I._finishTest());

  beforeEach(() => I._before().then(() => browser = I.browser));

  afterEach(() => I._after());

  describe('open page : #amOnPage', () => {
    it('should open main page of configured site', () => {
      I.amOnPage('/');
      return expect(browser.getCurrentUrl()).to.eventually.equal(`${siteUrl}/#/`);
    });

    it('should open absolute url', () => {
      I.amOnPage(siteUrl);
      return expect(browser.getCurrentUrl()).to.eventually.equal(`${siteUrl}/#/`);
    });
  });

  describe('current url : #seeInCurrentUrl, #seeCurrentUrlEquals, ...', () => {
    it('should check for url fragment', function* () {
      yield I.amOnPage(`${siteUrl}/#/info`);
      yield I.seeInCurrentUrl('/info');
      return I.dontSeeInCurrentUrl('/result');
    });

    it('should check for equality', function* () {
      yield I.amOnPage('/#/info');
      yield I.seeCurrentUrlEquals('/#/info');
      return I.dontSeeCurrentUrlEquals('/#/result');
    });
  });

  describe('see text : #see', () => {
    it('should check text on site', function* () {
      yield I.amOnPage('/');
      yield I.see('Description');
      return I.dontSee('Create Event Today');
    });

    it('should check text inside element', function* () {
      yield I.amOnPage('/#/info');
      yield I.see('About', 'h1');
      yield I.see('Welcome to event app', { css: 'p.jumbotron' });
      return I.see('Back to form', '//div/a');
    });
  });

  describe('see element : #seeElement, #dontSeeElement', () => {
    it('should check visible elements on page', function* () {
      yield I.amOnPage('/');
      yield I.seeElement('.btn.btn-primary');
      yield I.seeElement({ css: '.btn.btn-primary' });
      return I.dontSeeElement({ css: '.btn.btn-secondary' });
    });
  });

  describe('#click', () => {
    it('should click by text', function* () {
      yield I.amOnPage('/');
      yield I.dontSeeInCurrentUrl('/info');
      yield I.click('Get more info!');
      return I.seeInCurrentUrl('/info');
    });

    it('should click by css', function* () {
      yield I.amOnPage('/');
      yield I.click('.btn-primary');
      return I.seeInCurrentUrl('/result');
    });

    it('should click by non-optimal css', function* () {
      yield I.amOnPage('/');
      yield I.click('form a.btn');
      return I.seeInCurrentUrl('/result');
    });

    it('should click by xpath', function* () {
      yield I.amOnPage('/');
      yield I.click('//a[contains(., "more info")]');
      return I.seeInCurrentUrl('/info');
    });

    it('should click on context', function* () {
      yield I.amOnPage('/');
      yield I.click('.btn-primary', 'form');
      return I.seeInCurrentUrl('/result');
    });

    it('should click link with inner span', function* () {
      yield I.amOnPage('/#/result');
      yield I.click('Go to info');
      return I.seeInCurrentUrl('/info');
    });

    it('should click buttons as links', function* () {
      yield I.amOnPage('/');
      yield I.click('Options');
      return I.seeInCurrentUrl('/options');
    });
  });

  describe('#checkOption', () => {
    it('should check option by css', function* () {
      yield I.amOnPage('/#/options');
      yield I.dontSee('Accepted', '#terms');
      yield I.checkOption('.checkboxes .real');
      return I.see('Accepted', '#terms');
    });

    it('should check option by strict locator', function* () {
      yield I.amOnPage('/#/options');
      yield I.checkOption({ className: 'real' });
      return I.see('Accepted', '#terms');
    });

    it('should check option by name', function* () {
      yield I.amOnPage('/#/options');
      yield I.checkOption('agree');
      return I.see('Accepted', '#terms');
    });

    it('should check option by label', function* () {
      yield I.amOnPage('/');
      yield I.checkOption('Designers');
      yield I.click('Submit');
      return assertFormContains('for[0]', 'designers');
    });
  });

  describe('#selectOption', () => {
    it('should select option by css', function* () {
      yield I.amOnPage('/');
      yield I.selectOption('form select', 'Iron Man');
      yield I.click('Submit');
      return assertFormContains('speaker1', 'iron_man');
    });

    it('should select option by label', function* () {
      yield I.amOnPage('/');
      yield I.selectOption('Guest Speaker', 'Captain America');
      yield I.click('Submit');
      return assertFormContains('speaker1', 'captain_america');
    });

    it('should select option by label and value', function* () {
      yield I.amOnPage('/');
      yield I.selectOption('Guest Speaker', 'string:captain_america');
      yield I.click('Submit');
      return assertFormContains('speaker1', 'captain_america');
    });

    it('should select option in grouped select', function* () {
      yield I.amOnPage('/');
      yield I.selectOption('Speaker', 'Captain America');
      yield I.click('Submit');
      return assertFormContains('speaker2', 'captain_america');
    });
  });

  describe('#fillField, #appendField', () => {
    it('should fill input by label', function* () {
      yield I.amOnPage('/');
      yield I.fillField('Name', 'Jon Doe');
      yield I.click('Submit');
      return assertFormContains('name', 'Jon Doe');
    });

    it('should fill textarea by label', function* () {
      yield I.amOnPage('/');
      yield I.fillField('Description', 'Just the best event');
      yield I.click('Submit');
      return assertFormContains('description', 'Just the best event');
    });

    it('should fill field by placeholder', function* () {
      yield I.amOnPage('/');
      yield I.fillField('Please enter a name', 'Jon Doe');
      yield I.click('Submit');
      return assertFormContains('name', 'Jon Doe');
    });

    it('should fill field by css ', function* () {
      yield I.amOnPage('/#/options');
      yield I.fillField('input.code', '0123456');
      return I.see('Code: 0123456');
    });

    it('should fill field by model ', function* () {
      yield I.amOnPage('/#/options');
      yield I.fillField({ model: 'license' }, 'AAABBB');
      return I.see('AAABBB', '.results');
    });

    it('should fill field by name ', function* () {
      yield I.amOnPage('/#/options');
      yield I.fillField('mylicense', 'AAABBB');
      return I.see('AAABBB', '.results');
    });

    it('should fill textarea by name ', function* () {
      yield I.amOnPage('/#/options');
      yield I.fillField('sshkey', 'hellossh');
      return I.see('hellossh', '.results');
    });

    it('should fill textarea by css ', function* () {
      yield I.amOnPage('/#/options');
      yield I.fillField('.inputs textarea', 'hellossh');
      return I.see('SSH Public Key: hellossh', '.results');
    });

    it('should fill textarea by model', function* () {
      yield I.amOnPage('/#/options');
      yield I.fillField({ model: 'ssh' }, 'hellossh');
      return I.see('SSH Public Key: hellossh', '.results');
    });

    it('should append value to field', function* () {
      yield I.amOnPage('/#/options');
      yield I.appendField({ model: 'ssh' }, 'hellossh');
      return I.see('SSH Public Key: PUBLIC-SSH-KEYhellossh', '.results');
    });
  });

  describe('check fields: #seeInField, #seeCheckboxIsChecked, ...', () => {
    it('should check for empty field', function* () {
      yield I.amOnPage('/#/options');
      return I.seeInField('code', '');
    });

    it('should throw error if field is not empty', function* () {
      yield I.amOnPage('/#/options');
      return I.seeInField('#ssh', 'something')
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.be.equal('expected field by #ssh to include "something"');
        });
    });

    it('should check field equals', function* () {
      yield I.amOnPage('/#/options');
      yield I.seeInField({ model: 'ssh' }, 'PUBLIC-SSH-KEY');
      yield I.seeInField('#ssh', 'PUBLIC-SSH-KEY');
      yield I.seeInField('sshkey', 'PUBLIC-SSH-KEY');
      return yield I.dontSeeInField('sshkey', 'PUBLIC-SSL-KEY');
    });

    it('should check values in select', function* () {
      yield I.amOnPage('/#/options');
      return I.seeInField('auth', 'SSH');
    });

    it('should check checkbox is checked :)', function* () {
      yield I.amOnPage('/#/options');
      yield I.seeCheckboxIsChecked('notagree');
      yield I.dontSeeCheckboxIsChecked({ model: 'agree' });
      return I.dontSeeCheckboxIsChecked('#agreenot');
    });
  });

  describe('#grabTextFrom, #grabValueFrom, #grabAttributeFrom', () => {
    it('should grab text from page', function* () {
      yield I.amOnPage('/#/info');
      const val = yield I.grabTextFrom('p.jumbotron');
      return expect(val).to.equal('Welcome to event app');
    });

    it('should grab value from field', function* () {
      yield I.amOnPage('/#/options');
      const val = yield I.grabValueFrom('#ssh');
      return expect(val).to.equal('PUBLIC-SSH-KEY');
    });

    it('should grab value from select', function* () {
      yield I.amOnPage('/#/options');
      const val = yield I.grabValueFrom('auth');
      return expect(val).to.equal('ssh');
    });

    it('should grab attribute from element', function* () {
      yield I.amOnPage('/#/info');
      const val = yield I.grabAttributeFrom('a.btn', 'ng-href');
      return expect(val).to.equal('#/');
    });
  });

  describe('page title : #seeTitle, #dontSeeTitle, #grabTitle, #seeTitleEquals', () => {
    it('should check page title', function* () {
      yield I.amOnPage('/');
      return I.seeInTitle('Event App');
    });

    it('should grab page title', function* () {
      yield I.amOnPage('/');
      return expect(I.grabTitle()).to.eventually.equal('Event App');
    });

    it('should check that title is equal to provided one', () => I.amOnPage('/')
      .then(() => I.seeTitleEquals('Event App'))
      .then(() => I.seeTitleEquals('Event Ap'))
      .then(() => assert.equal(true, false, 'Throw an error because it should not get this far!'))
      .catch((e) => {
        e.should.be.instanceOf(Error);
        e.message.should.be.equal('expected web page title "Event App" to equal "Event Ap"');
      }));
  });

  describe('#seeTextEquals', () => {
    it('should check text is equal to provided one', () => I.amOnPage('/')
      .then(() => I.seeTextEquals('Create Event', 'h1'))
      .then(() => I.seeTextEquals('Create Even', 'h1'))
      .catch((e) => {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.include("expected element h1 'Create Event' to equal 'Create Even'");
      }));
  });

  describe('#saveScreenshot', () => {
    beforeEach(() => {
      global.output_dir = path.join(global.codecept_dir, 'output');
    });

    it('should create a screenshot file in output dir', function* () {
      yield I.amOnPage('/');
      yield I.saveScreenshot('protractor_user.png');
      return assert.ok(fileExists(path.join(output_dir, 'protractor_user.png')), null, 'file does not exists');
    });

    it('should create full page a screenshot file in output dir', function* () {
      yield I.amOnPage('/');
      yield I.saveScreenshot('protractor_user_full.png', true);
      return assert.ok(fileExists(path.join(output_dir, 'protractor_user_full.png')), null, 'file does not exists');
    });
  });

  describe('#switchToNextTab, #switchToPreviousTab, #openNewTab, #closeCurrentTab, #closeOtherTabs, #grabNumberOfOpenTabs', () => {
    it('should only have 1 tab open when the browser starts and navigates to the first page', () => I.amOnPage('/')
      .then(() => I.grabNumberOfOpenTabs())
      .then(numPages => assert.equal(numPages, 1)));

    it('should switch to next tab', () => I.amOnPage('/')
      .then(() => I.grabNumberOfOpenTabs())
      .then(numPages => assert.equal(numPages, 1))
      .then(() => I.click('Get More Options'))
      .then(() => I.seeCurrentUrlEquals('/#/options'))
      .then(() => I.openNewTab())
      .then(() => I.amOnPage('/'))
      .then(() => I.click('Get more info!'))
      .then(() => I.seeCurrentUrlEquals('/#/info'))
      .then(() => I.switchToPreviousTab())
      .then(() => I.seeCurrentUrlEquals('/#/options'))
      .then(() => I.switchToNextTab())
      .then(() => I.seeCurrentUrlEquals('/#/info'))
      .then(() => I.grabNumberOfOpenTabs())
      .then(numPages => assert.equal(numPages, 2)));

    it('should assert when there is no ability to switch to next tab', () => I.amOnPage('/')
      .then(() => I.click('Get More Options'))
      .then(() => I.switchToNextTab(2))
      .then(() => assert.equal(true, false, 'Throw an error if it gets this far (which it should not)!'))
      .catch((e) => {
        assert.equal(e.message, 'There is no ability to switch to next tab with offset 2');
      }));

    it('should assert when there is no ability to switch to previous tab', () => I.amOnPage('/')
      .then(() => I.click('Get More Options'))
      .then(() => I.switchToPreviousTab(2))
      .then(() => assert.equal(true, false, 'Throw an error if it gets this far (which it should not)!'))
      .catch((e) => {
        assert.equal(e.message, 'There is no ability to switch to previous tab with offset 2');
      }));

    it('should close current tab', () => I.amOnPage('/')
      .then(() => I.click('Get more info!'))
      .then(() => I.seeInCurrentUrl('#/info'))
      .then(() => I.openNewTab())
      .then(() => I.amOnPage('/'))
      .then(() => I.grabNumberOfOpenTabs())
      .then(numPages => assert.equal(numPages, 2))
      .then(() => I.seeInCurrentUrl('#/'))
      .then(() => I.dontSeeInCurrentUrl('#/info'))
      .then(() => I.closeCurrentTab())
      .then(() => I.seeInCurrentUrl('#/info'))
      .then(() => I.grabNumberOfOpenTabs())
      .then(numPages => assert.equal(numPages, 1)));

    it('should close other tabs', () => I.amOnPage('/')
      .then(() => I.click('Get more info!'))
      .then(() => I.seeCurrentUrlEquals('/#/info'))
      .then(() => I.openNewTab())
      .then(() => I.amOnPage('/'))
      .then(() => I.openNewTab())
      .then(() => I.amOnPage('/'))
      .then(() => I.grabNumberOfOpenTabs())
      .then(numPages => assert.equal(numPages, 3))
      .then(() => I.click('Get More Options'))
      .then(() => I.seeCurrentUrlEquals('/#/options'))
      .then(() => I.closeOtherTabs())
      .then(() => I.seeCurrentUrlEquals('/#/options'))
      .then(() => I.grabNumberOfOpenTabs())
      .then(numPages => assert.equal(numPages, 1)));

    it('should open new tab', () => I.amOnPage('/')
      .then(() => I.grabNumberOfOpenTabs())
      .then(numPages => assert.equal(numPages, 1))
      .then(() => I.openNewTab())
      .then(() => I.amOutsideAngularApp())
      .then(() => I.seeInCurrentUrl('about:blank'))
      .then(() => I.grabNumberOfOpenTabs())
      .then(numPages => assert.equal(numPages, 2)));

    it('should switch to previous tab', () => I.amOnPage('/')
      .then(() => I.click('Get more info!'))
      .then(() => I.openNewTab())
      .then(() => I.amOnPage('/'))
      .then(() => I.seeInCurrentUrl('/#/'))
      .then(() => I.switchToPreviousTab())
      .then(() => I.wait(2))
      .then(() => I.seeInCurrentUrl('/#/info')));
  });

  describe('cookies : #setCookie, #clearCookies, #seeCookie', () => {
    it('should do all cookie stuff', function* () {
      yield I.amOnPage('/');
      yield I.setCookie({ name: 'auth', value: '123456' });
      yield I.seeCookie('auth');
      yield I.dontSeeCookie('auuth');
      yield I.grabCookie('auth').then(cookie => assert.equal(cookie.value, '123456'));
      yield I.clearCookie('auth');
      yield I.dontSeeCookie('auth');
    });
  });

  describe('#seeInSource, #grabSource', () => {
    it('should check for text to be in HTML source', function* () {
      yield I.amOnPage('/');
      yield I.seeInSource('<meta charset="utf-8"');
      return I.dontSeeInSource('<article');
    });

    it('should grab the source', async () => {
      await I.amOnPage('/');
      const source = await I.grabSource();
      assert.notEqual(source.indexOf('<meta charset="utf-8"'), -1, 'Source html should be retrieved');
    });
  });

  describe('window size : #resizeWindow', () => {
    it('should change the active window size', function* () {
      yield I.amOnPage('/');
      yield I.resizeWindow(640, 480);
      const size = yield I.browser.manage().window().getSize();
      assert.equal(size.width, 640);
      assert.equal(size.height, 480);
    });
  });

  describe('#amOutsideAngularApp', () => {
    it('should work outside angular app', function* () {
      yield I.amOutsideAngularApp();
      yield I.amOnPage(web_app_url);
      yield I.click('More info');
      return I.see('Information', 'h1');
    });

    it('should switch between applications', function* () {
      yield I.amOutsideAngularApp();
      yield I.amOnPage(web_app_url);
      yield I.see('Welcome', 'h1');
      yield I.amInsideAngularApp();
      yield I.amOnPage('/');
      yield I.seeInCurrentUrl(siteUrl);
      return I.see('Create Event');
    });
  });

  describe('waitForVisible', () => {
    beforeEach(() => I.amOnPage('/#/info'));

    it('wait for element', function* () {
      yield I.dontSeeElement('#hello');
      yield I.waitForVisible('#hello', 2);
      yield I.seeElement('#hello');
      yield I.see('Boom', '#hello');
    });
  });

  describe('#waitForText', () => {
    beforeEach(() => I.amOnPage('/#/info'));

    it('should wait for text', function* () {
      yield I.dontSee('Boom!');
      yield I.waitForText('Boom!', 2);
      return I.see('Boom!');
    });

    it('should wait for text in context', function* () {
      yield I.dontSee('Boom!');
      yield I.waitForText('Boom!', 2, '#hello');
      return I.see('Boom!');
    });

    it('should return error if not present', function* () {
      return I.waitForText('Nothing here', 0, '#hello')
        .then(() => { throw new Error('😟'); })
        .catch((e) => {
          e.message.should.include('Wait timed out');
        });
    });

    it('should return error if waiting is too small', function* () {
      return I.waitForText('Boom!', 0.5)
        .then(() => { throw new Error('😟'); })
        .catch((e) => {
          e.message.should.include('Wait timed out');
        });
    });

    describe('#seeNumberOfElements', () => {
      it('should return 1 as count', () => I.amOnPage('/')
        .then(() => I.seeNumberOfElements('h1', 1)));
    });
  });
});
