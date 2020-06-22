const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');

const Protractor = require('../../lib/helper/Protractor');
const TestHelper = require('../support/TestHelper');
const AssertionFailedError = require('../../lib/assert/error');
const formContents = require('../../lib/utils').test.submittedData(path.join(__dirname, '/../data/app/db'));
const fileExists = require('../../lib/utils').fileExists;

const web_app_url = TestHelper.siteUrl();
const siteUrl = TestHelper.angularSiteUrl();
let I;
let browser;

chai.use(chaiAsPromised);
const expect = chai.expect;

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
    it('should open main page of configured site', async () => {
      await I.amOnPage('/');
      expect(browser.getCurrentUrl()).to.eventually.equal(`${siteUrl}/#/`);
    });

    it('should open absolute url', async () => {
      await I.amOnPage(siteUrl);
      expect(browser.getCurrentUrl()).to.eventually.equal(`${siteUrl}/#/`);
    });
  });

  describe('current url : #seeInCurrentUrl, #seeCurrentUrlEquals, ...', () => {
    it('should check for url fragment', async () => {
      await I.amOnPage(`${siteUrl}/#/info`);
      await I.seeInCurrentUrl('/info');
      await I.dontSeeInCurrentUrl('/result');
    });

    it('should check for equality', async () => {
      await I.amOnPage('/#/info');
      await I.seeCurrentUrlEquals('/#/info');
      await I.dontSeeCurrentUrlEquals('/#/result');
    });
  });

  describe('see text : #see', () => {
    it('should check text on site', async () => {
      await I.amOnPage('/');
      await I.see('Description');
      await I.dontSee('Create Event Today');
    });

    it('should check text inside element', async () => {
      await I.amOnPage('/#/info');
      await I.see('About', 'h1');
      await I.see('Welcome to event app', { css: 'p.jumbotron' });
      await I.see('Back to form', '//div/a');
    });
  });

  describe('see element : #seeElement, #dontSeeElement', () => {
    it('should check visible elements on page', async () => {
      await I.amOnPage('/');
      await I.seeElement('.btn.btn-primary');
      await I.seeElement({ css: '.btn.btn-primary' });
      await I.dontSeeElement({ css: '.btn.btn-secondary' });
    });
  });

  describe('#click', () => {
    it('should click by text', async () => {
      await I.amOnPage('/');
      await I.dontSeeInCurrentUrl('/info');
      await I.click('Get more info!');
      await I.seeInCurrentUrl('/info');
    });

    it('should click by css', async () => {
      await I.amOnPage('/');
      await I.click('.btn-primary');
      await I.seeInCurrentUrl('/result');
    });

    it('should click by non-optimal css', async () => {
      await I.amOnPage('/');
      await I.click('form a.btn');
      await I.seeInCurrentUrl('/result');
    });

    it('should click by xpath', async () => {
      await I.amOnPage('/');
      await I.click('//a[contains(., "more info")]');
      await I.seeInCurrentUrl('/info');
    });

    it('should click on context', async () => {
      await I.amOnPage('/');
      await I.click('.btn-primary', 'form');
      await I.seeInCurrentUrl('/result');
    });

    it('should click link with inner span', async () => {
      await I.amOnPage('/#/result');
      await I.click('Go to info');
      await I.seeInCurrentUrl('/info');
    });

    it('should click buttons as links', async () => {
      await I.amOnPage('/');
      await I.click('Options');
      await I.seeInCurrentUrl('/options');
    });
  });

  describe('#checkOption', () => {
    it('should check option by css', async () => {
      await I.amOnPage('/#/options');
      await I.dontSee('Accepted', '#terms');
      await I.checkOption('.checkboxes .real');
      await I.see('Accepted', '#terms');
    });

    it('should check option by strict locator', async () => {
      await I.amOnPage('/#/options');
      await I.checkOption({ className: 'real' });
      await I.see('Accepted', '#terms');
    });

    it('should check option by name', async () => {
      await I.amOnPage('/#/options');
      await I.checkOption('agree');
      await I.see('Accepted', '#terms');
    });

    it('should check option by label', async () => {
      await I.amOnPage('/');
      await I.checkOption('Designers');
      await I.click('Submit');
      await assertFormContains('for[0]', 'designers');
    });
  });

  describe('#selectOption', () => {
    it('should select option by css', async () => {
      await I.amOnPage('/');
      await I.selectOption('form select', 'Iron Man');
      await I.click('Submit');
      await assertFormContains('speaker1', 'iron_man');
    });

    it('should select option by label', async () => {
      await I.amOnPage('/');
      await I.selectOption('Guest Speaker', 'Captain America');
      await I.click('Submit');
      await assertFormContains('speaker1', 'captain_america');
    });

    it('should select option by label and value', async () => {
      await I.amOnPage('/');
      await I.selectOption('Guest Speaker', 'string:captain_america');
      await I.click('Submit');
      await assertFormContains('speaker1', 'captain_america');
    });

    it('should select option in grouped select', async () => {
      await I.amOnPage('/');
      await I.selectOption('Speaker', 'Captain America');
      await I.click('Submit');
      await assertFormContains('speaker2', 'captain_america');
    });
  });

  describe('#fillField, #appendField', () => {
    it('should fill input by label', async () => {
      await I.amOnPage('/');
      await I.fillField('Name', 'Jon Doe');
      await I.click('Submit');
      await assertFormContains('name', 'Jon Doe');
    });

    it('should fill textarea by label', async () => {
      await I.amOnPage('/');
      await I.fillField('Description', 'Just the best event');
      await I.click('Submit');
      await assertFormContains('description', 'Just the best event');
    });

    it('should fill field by placeholder', async () => {
      await I.amOnPage('/');
      await I.fillField('Please enter a name', 'Jon Doe');
      await I.click('Submit');
      await assertFormContains('name', 'Jon Doe');
    });

    it('should fill field by css ', async () => {
      await I.amOnPage('/#/options');
      await I.fillField('input.code', '0123456');
      await I.see('Code: 0123456');
    });

    it('should fill field by model ', async () => {
      await I.amOnPage('/#/options');
      await I.fillField({ model: 'license' }, 'AAABBB');
      await I.see('AAABBB', '.results');
    });

    it('should fill field by name ', async () => {
      await I.amOnPage('/#/options');
      await I.fillField('mylicense', 'AAABBB');
      await I.see('AAABBB', '.results');
    });

    it('should fill textarea by name ', async () => {
      await I.amOnPage('/#/options');
      await I.fillField('sshkey', 'hellossh');
      await I.see('hellossh', '.results');
    });

    it('should fill textarea by css ', async () => {
      await I.amOnPage('/#/options');
      await I.fillField('.inputs textarea', 'hellossh');
      await I.see('SSH Public Key: hellossh', '.results');
    });

    it('should fill textarea by model', async () => {
      await I.amOnPage('/#/options');
      await I.fillField({ model: 'ssh' }, 'hellossh');
      await I.see('SSH Public Key: hellossh', '.results');
    });

    it('should append value to field', async () => {
      await I.amOnPage('/#/options');
      await I.appendField({ model: 'ssh' }, 'hellossh');
      await I.see('SSH Public Key: PUBLIC-SSH-KEYhellossh', '.results');
    });
  });

  describe('check fields: #seeInField, #seeCheckboxIsChecked, ...', () => {
    it('should check for empty field', async () => {
      await I.amOnPage('/#/options');
      await I.seeInField('code', '');
    });

    it('should throw error if field is not empty', async () => {
      await I.amOnPage('/#/options');

      try {
        await I.seeInField('#ssh', 'something');
      } catch (e) {
        e.should.be.instanceOf(AssertionFailedError);
        e.inspect().should.be.equal('expected field by #ssh to include "something"');
      }
    });

    it('should check field equals', async () => {
      await I.amOnPage('/#/options');
      await I.seeInField({ model: 'ssh' }, 'PUBLIC-SSH-KEY');
      await I.seeInField('#ssh', 'PUBLIC-SSH-KEY');
      await I.seeInField('sshkey', 'PUBLIC-SSH-KEY');
      await I.dontSeeInField('sshkey', 'PUBLIC-SSL-KEY');
    });

    it('should check values in select', async () => {
      await I.amOnPage('/#/options');
      await I.seeInField('auth', 'SSH');
    });

    it('should check checkbox is checked :)', async () => {
      await I.amOnPage('/#/options');
      await I.seeCheckboxIsChecked('notagree');
      await I.dontSeeCheckboxIsChecked({ model: 'agree' });
      await I.dontSeeCheckboxIsChecked('#agreenot');
    });
  });

  describe('#grabTextFrom, #grabValueFrom, #grabAttributeFrom', () => {
    it('should grab text from page', async () => {
      await I.amOnPage('/#/info');
      const val = await I.grabTextFrom('p.jumbotron');
      expect(val).to.equal('Welcome to event app');
    });

    it('should grab value from field', async () => {
      await I.amOnPage('/#/options');
      const val = await I.grabValueFrom('#ssh');
      expect(val).to.equal('PUBLIC-SSH-KEY');
    });

    it('should grab value from select', async () => {
      await I.amOnPage('/#/options');
      const val = await I.grabValueFrom('auth');
      expect(val).to.equal('ssh');
    });

    it('should grab attribute from element', async () => {
      await I.amOnPage('/#/info');
      const val = await I.grabAttributeFrom('a.btn', 'ng-href');
      expect(val).to.equal('#/');
    });
  });

  describe('page title : #seeTitle, #dontSeeTitle, #grabTitle, #seeTitleEquals', () => {
    it('should check page title', async () => {
      await I.amOnPage('/');
      await I.seeInTitle('Event App');
    });

    it('should grab page title', async () => {
      await I.amOnPage('/');
      expect(I.grabTitle()).to.eventually.equal('Event App');
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

    it('should create a screenshot file in output dir', async () => {
      await I.amOnPage('/');
      await I.saveScreenshot('protractor_user.png');
      assert.ok(fileExists(path.join(output_dir, 'protractor_user.png')), null, 'file does not exists');
    });

    it('should create full page a screenshot file in output dir', async () => {
      await I.amOnPage('/');
      await I.saveScreenshot('protractor_user_full.png', true);
      assert.ok(fileExists(path.join(output_dir, 'protractor_user_full.png')), null, 'file does not exists');
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
    it('should do all cookie stuff', async () => {
      await I.amOnPage('/');
      await I.setCookie({ name: 'auth', value: '123456' });
      await I.seeCookie('auth');
      await I.dontSeeCookie('auuth');
      await I.grabCookie('auth').then(cookie => assert.equal(cookie.value, '123456'));
      await I.clearCookie('auth');
      await I.dontSeeCookie('auth');
    });
  });

  describe('#seeInSource, #grabSource', () => {
    it('should check for text to be in HTML source', async () => {
      await I.amOnPage('/');
      await I.seeInSource('<meta charset="utf-8"');
      await I.dontSeeInSource('<article');
    });

    it('should grab the source', async () => {
      await I.amOnPage('/');
      const source = await I.grabSource();
      assert.notEqual(source.indexOf('<meta charset="utf-8"'), -1, 'Source html should be retrieved');
    });
  });

  describe('window size : #resizeWindow', () => {
    it('should change the active window size', async () => {
      await I.amOnPage('/');
      await I.resizeWindow(640, 480);
      const size = await I.browser.manage().window().getSize();
      assert.equal(size.width, 640);
      assert.equal(size.height, 480);
    });
  });

  describe('#amOutsideAngularApp', () => {
    it('should work outside angular app', async () => {
      await I.amOutsideAngularApp();
      await I.amOnPage(web_app_url);
      await I.click('More info');
      await I.see('Information', 'h1');
    });

    it('should switch between applications', async () => {
      await I.amOutsideAngularApp();
      await I.amOnPage(web_app_url);
      await I.see('Welcome', 'h1');
      await I.amInsideAngularApp();
      await I.amOnPage('/');
      await I.seeInCurrentUrl(siteUrl);
      await I.see('Create Event');
    });
  });

  describe('waitForVisible', () => {
    beforeEach(() => I.amOnPage('/#/info'));

    it('wait for element', async () => {
      await I.dontSeeElement('#hello');
      await I.waitForVisible('#hello', 2);
      await I.seeElement('#hello');
      await I.see('Boom', '#hello');
    });
  });

  describe('#waitForText', () => {
    beforeEach(() => I.amOnPage('/#/info'));

    it('should wait for text', async () => {
      await I.dontSee('Boom!');
      await I.waitForText('Boom!', 2);
      await I.see('Boom!');
    });

    it('should wait for text in context', async () => {
      await I.dontSee('Boom!');
      await I.waitForText('Boom!', 2, '#hello');
      await I.see('Boom!');
    });

    it('should return error if not present', async () => {
      try {
        await I.waitForText('Nothing here', 0, '#hello');
        throw new Error('😟');
      } catch (e) {
        e.message.should.include('Wait timed out');
      }
    });

    it('should return error if waiting is too small', async () => {
      try {
        await I.waitForText('Boom!', 0.5);
        throw new Error('😟');
      } catch (e) {
        e.message.should.include('Wait timed out');
      }
    });

    describe('#seeNumberOfElements', () => {
      it('should return 1 as count', async () => {
        await I.amOnPage('/');
        await I.seeNumberOfElements('h1', 1);
      });
    });
  });
});
