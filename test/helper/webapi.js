require('co-mocha')(require('mocha'));

let I;
let data;
let siteUrl;
const assert = require('assert');
const path = require('path');

const dataFile = path.join(__dirname, '/../data/app/db');
const formContents = require('../../lib/utils').test.submittedData(dataFile);
const fileExists = require('../../lib/utils').fileExists;

module.exports.init = function (testData) {
  data = testData;
};

module.exports.tests = function () {
  const isHelper = helperName => I.constructor.name === helperName;

  beforeEach(() => {
    I = data.I;
    siteUrl = data.siteUrl;
    if (fileExists(dataFile)) require('fs').unlinkSync(dataFile);
  });

  describe('current url : #seeInCurrentUrl, #seeCurrentUrlEquals, #grabCurrentUrl, ...', () => {
    it('should check for url fragment', function* () {
      yield I.amOnPage('/form/checkbox');
      yield I.seeInCurrentUrl('/form');
      return I.dontSeeInCurrentUrl('/user');
    });

    it('should check for equality', function* () {
      yield I.amOnPage('/info');
      yield I.seeCurrentUrlEquals('/info');
      return I.dontSeeCurrentUrlEquals('form');
    });

    it('should check for equality in absolute urls', function* () {
      yield I.amOnPage('/info');
      yield I.seeCurrentUrlEquals(`${siteUrl}/info`);
      return I.dontSeeCurrentUrlEquals(`${siteUrl}/form`);
    });

    it('should grab browser url', function* () {
      yield I.amOnPage('/info');
      const url = yield I.grabCurrentUrl();
      return assert.equal(url, `${siteUrl}/info`);
    });
  });

  describe('#waitInUrl, #waitUrlEquals', () => {
    it('should wait part of the URL to match the expected', async () => {
      if (isHelper('Nightmare')) return;
      try {
        await I.amOnPage('/info');
        await I.waitInUrl('/info');
        await I.waitInUrl('/info2', 0.1);
      } catch (e) {
        assert.equal(e.message, `expected url to include /info2, but found ${siteUrl}/info`);
      }
    });

    it('should wait for the entire URL to match the expected', async () => {
      if (isHelper('Nightmare')) return;
      try {
        await I.amOnPage('/info');
        await I.waitUrlEquals('/info');
        await I.waitUrlEquals(`${siteUrl}/info`);
        await I.waitUrlEquals('/info2', 0.1);
      } catch (e) {
        assert.equal(e.message, `expected url to be ${siteUrl}/info2, but found ${siteUrl}/info`);
      }
    });
  });

  describe('see text : #see', () => {
    it('should check text on site', function* () {
      yield I.amOnPage('/');
      yield I.see('Welcome to test app!');
      yield I.see('A wise man said: "debug!"');
      return I.dontSee('Info');
    });

    it('should check text inside element', function* () {
      yield I.amOnPage('/');
      yield I.see('Welcome to test app!', 'h1');
      yield I.amOnPage('/info');
      yield I.see('valuable', {
        css: 'p',
      });
      yield I.see('valuable', '//body/p');
      return I.dontSee('valuable', 'h1');
    });

    it('should verify non-latin chars', function* () {
      yield I.amOnPage('/info');
      yield I.see('на');
      yield I.see("Don't do that at home!", 'h3');
      return I.see('Текст', 'p');
    });
  });

  describe('see element : #seeElement, #seeElementInDOM, #dontSeeElement', () => {
    it('should check visible elements on page', function* () {
      yield I.amOnPage('/form/field');
      yield I.seeElement('input[name=name]');
      yield I.seeElement({
        name: 'name',
      });
      yield I.seeElement('//input[@id="name"]');
      yield I.dontSeeElement('#something-beyond');
      return I.dontSeeElement('//input[@id="something-beyond"]');
    });

    it('should check elements are in the DOM', function* () {
      yield I.amOnPage('/form/field');
      yield I.seeElementInDOM('input[name=name]');
      yield I.seeElementInDOM('//input[@id="name"]');
      yield I.dontSeeElementInDOM('#something-beyond');
      return I.dontSeeElementInDOM('//input[@id="something-beyond"]');
    });

    it('should check elements are visible on the page', function* () {
      yield I.amOnPage('/form/field');
      yield I.seeElementInDOM('input[name=email]');
      yield I.dontSeeElement('input[name=email]');
      return I.dontSeeElement('#something-beyond');
    });
  });

  describe('#seeNumberOfVisibleElements', () => {
    it('should check number of visible elements for given locator', () => I.amOnPage('/info')
      .then(() => I.seeNumberOfVisibleElements('//div[@id = "grab-multiple"]//a', 3)));
  });

  describe('#grabNumberOfVisibleElements', () => {
    it('should grab number of visible elements for given locator', () => I.amOnPage('/info')
      .then(() => I.grabNumberOfVisibleElements('//div[@id = "grab-multiple"]//a'))
      .then(num => assert.equal(num, 3)));
    it('should support locators like {xpath:"//div"}', () => I.amOnPage('/info')
      .then(() => I.grabNumberOfVisibleElements({
        xpath: '//div[@id = "grab-multiple"]//a',
      }))
      .then(num => assert.equal(num, 3)));
    it('should grab number of visible elements for given css locator', () => I.amOnPage('/info')
      .then(() => I.grabNumberOfVisibleElements('[id=grab-multiple] a'))
      .then(num => assert.equal(num, 3)));
    it('should return 0 for non-existing elements', () => I.amOnPage('/info')
      .then(() => I.grabNumberOfVisibleElements('button[type=submit]'))
      .then(num => assert.equal(num, 0)));
  });

  describe('#seeInSource, #dontSeeInSource', () => {
    it('should check meta of a page', function* () {
      yield I.amOnPage('/info');
      yield I.seeInSource('<body>');
      yield I.dontSeeInSource('<meta>');
      yield I.seeInSource('Invisible text');
      return I.seeInSource('content="text/html; charset=utf-8"');
    });
  });

  describe('#click', () => {
    it('should click by inner text', function* () {
      yield I.amOnPage('/');
      yield I.click('More info');
      return I.seeInCurrentUrl('/info');
    });

    it('should click by css', function* () {
      yield I.amOnPage('/');
      yield I.click('#link');
      return I.seeInCurrentUrl('/info');
    });

    it('should click by xpath', function* () {
      yield I.amOnPage('/');
      yield I.click('//a[@id="link"]');
      return I.seeInCurrentUrl('/info');
    });

    it('should click by name', function* () {
      yield I.amOnPage('/form/button');
      yield I.click('btn0');
      return assert.equal(formContents('text'), 'val');
    });

    it('should click on context', function* () {
      yield I.amOnPage('/');
      yield I.click('More info', 'body>p');
      return I.seeInCurrentUrl('/info');
    });

    it('should not click wrong context', function* () {
      let err = false;
      yield I.amOnPage('/');
      return I.click('More info', '#area1')
        .catch(e => err = true)
        .then(() => assert.ok(err));
    });

    it('should click link with inner span', function* () {
      yield I.amOnPage('/form/example7');
      yield I.click('Buy Chocolate Bar');
      // yield I.wait(3);
      return I.seeCurrentUrlEquals('/');
    });

    it('should click link with xpath locator', function* () {
      yield I.amOnPage('/form/example7');
      yield I.click({
        xpath: '(//*[@title = "Chocolate Bar"])[1]',
      });
      return I.seeCurrentUrlEquals('/');
    });
  });

  describe('#doubleClick', () => {
    it('it should doubleClick', function* () {
      yield I.amOnPage('/form/doubleclick');
      yield I.dontSee('Done');
      yield I.doubleClick('#block');
      return I.see('Done');
    });
  });

  describe('#checkOption', () => {
    it('should check option by css', function* () {
      yield I.amOnPage('/form/checkbox');
      yield I.checkOption('#checkin');
      yield I.click('Submit');
      yield I.wait(1);
      return assert.equal(formContents('terms'), 'agree');
    });

    it('should check option by strict locator', function* () {
      yield I.amOnPage('/form/checkbox');
      yield I.checkOption({
        id: 'checkin',
      });
      yield I.click('Submit');
      return assert.equal(formContents('terms'), 'agree');
    });

    it('should check option by name', function* () {
      yield I.amOnPage('/form/checkbox');
      yield I.checkOption('terms');
      yield I.click('Submit');
      return assert.equal(formContents('terms'), 'agree');
    });

    it('should check option by label', function* () {
      yield I.amOnPage('/form/checkbox');
      yield I.checkOption('I Agree');
      yield I.click('Submit');
      return assert.equal(formContents('terms'), 'agree');
    });

    it('should check option by context', function* () {
      yield I.amOnPage('/form/example1');
      yield I.checkOption('Remember me next time', '.rememberMe');
      yield I.click('Login');
      return assert.equal(formContents('LoginForm').rememberMe, 1);
    });
  });

  describe('#selectOption', () => {
    it('should select option by css', function* () {
      yield I.amOnPage('/form/select');
      yield I.selectOption('form select[name=age]', 'adult');
      yield I.click('Submit');
      return assert.equal(formContents('age'), 'adult');
    });

    it('should select option by name', function* () {
      yield I.amOnPage('/form/select');
      yield I.selectOption('age', 'adult');
      yield I.click('Submit');
      return assert.equal(formContents('age'), 'adult');
    });

    it('should select option by label', function* () {
      yield I.amOnPage('/form/select');
      yield I.selectOption('Select your age', 'dead');
      yield I.click('Submit');
      return assert.equal(formContents('age'), 'dead');
    });

    it('should select option by label and option text', function* () {
      yield I.amOnPage('/form/select');
      yield I.selectOption('Select your age', '21-60');
      yield I.click('Submit');
      return assert.equal(formContents('age'), 'adult');
    });

    it('should select option by label and option text - with an onchange callback', function* () {
      yield I.amOnPage('/form/select_onchange');
      yield I.selectOption('Select a value', 'Option 2');
      yield I.click('Submit');
      return assert.equal(formContents('select'), 'option2');
    });

    it('should select multiple options', function* () {
      yield I.amOnPage('/form/select_multiple');
      yield I.selectOption('What do you like the most?', ['Play Video Games', 'Have Sex']);
      yield I.click('Submit');
      return assert.deepEqual(formContents('like'), ['play', 'adult']);
    });
  });

  describe('#executeScript', () => {
    it('should execute synchronous script', function* () {
      yield I.amOnPage('/');
      yield I.executeScript(() => {
        document.getElementById('link').innerHTML = 'Appended';
      });
      return I.see('Appended', 'a');
    });

    it('should return value from sync script', function* () {
      yield I.amOnPage('/');
      const val = yield I.executeScript(a => a + 5, 5);
      assert.equal(val, 10);
    });

    it('should execute async script', function* () {
      yield I.amOnPage('/');
      const val = yield I.executeAsyncScript((val, done) => {
        setTimeout(() => {
          document.getElementById('link').innerHTML = val;
          done(5);
        }, 100);
      }, 'Timeout');
      assert.equal(val, 5);
      return I.see('Timeout', 'a');
    });
  });

  describe('#fillField, #appendField', () => {
    it('should fill input fields', function* () {
      yield I.amOnPage('/form/field');
      yield I.fillField('Name', 'Nothing special');
      yield I.click('Submit');
      return assert.equal(formContents('name'), 'Nothing special');
    });

    it('should fill field by css', function* () {
      yield I.amOnPage('/form/field');
      yield I.fillField('#name', 'Nothing special');
      yield I.click('Submit');
      return assert.equal(formContents('name'), 'Nothing special');
    });

    it('should fill field by strict locator', function* () {
      yield I.amOnPage('/form/field');
      yield I.fillField({
        id: 'name',
      }, 'Nothing special');
      yield I.click('Submit');
      return assert.equal(formContents('name'), 'Nothing special');
    });

    it('should fill field by name', function* () {
      yield I.amOnPage('/form/example1');
      yield I.fillField('LoginForm[username]', 'davert');
      yield I.fillField('LoginForm[password]', '123456');
      yield I.click('Login');
      assert.equal(formContents('LoginForm').username, 'davert');
      return assert.equal(formContents('LoginForm').password, '123456');
    });

    it('should fill textarea by css', function* () {
      yield I.amOnPage('/form/textarea');
      yield I.fillField('textarea', 'Nothing special');
      yield I.click('Submit');
      return assert.equal(formContents('description'), 'Nothing special');
    });

    it('should fill textarea by label', function* () {
      yield I.amOnPage('/form/textarea');
      yield I.fillField('Description', 'Nothing special');
      yield I.click('Submit');
      return assert.equal(formContents('description'), 'Nothing special');
    });

    it('should fill textarea by overwritting the existing value', function* () {
      yield I.amOnPage('/form/textarea');
      yield I.fillField('Description', 'Nothing special');
      yield I.fillField('Description', 'Some other text');
      yield I.click('Submit');
      return assert.equal(formContents('description'), 'Some other text');
    });

    it('should append field value', function* () {
      yield I.amOnPage('/form/field');
      yield I.appendField('Name', '_AND_NEW');
      yield I.click('Submit');
      return assert.equal(formContents('name'), 'OLD_VALUE_AND_NEW');
    });
  });


  describe('#clearField', () => {
    it('should clear a given element', () => I.amOnPage('/form/field')
      .then(() => I.fillField('#name', 'Nothing special'))
      .then(() => I.seeInField('#name', 'Nothing special'))
      .then(() => I.clearField('#name'))
      .then(() => I.dontSeeInField('#name', 'Nothing special')));

    it('should clear field by name', function* () {
      yield I.amOnPage('/form/example1');
      yield I.clearField('LoginForm[username]');
      yield I.click('Login');
      return assert.equal(formContents('LoginForm').username, '');
    });

    it('should clear field by locator', function* () {
      yield I.amOnPage('/form/example1');
      yield I.clearField('#LoginForm_username');
      yield I.click('Login');
      return assert.equal(formContents('LoginForm').username, '');
    });
  });

  describe('check fields: #seeInField, #seeCheckboxIsChecked, ...', () => {
    it('should check for empty field', function* () {
      yield I.amOnPage('/form/empty');
      return I.seeInField('#empty_input', '');
    });

    it('should check for empty textarea', function* () {
      yield I.amOnPage('/form/empty');
      return I.seeInField('#empty_textarea', '');
    });

    it('should check field equals', function* () {
      yield I.amOnPage('/form/field');
      yield I.seeInField('Name', 'OLD_VALUE');
      yield I.seeInField('name', 'OLD_VALUE');
      yield I.seeInField('//input[@id="name"]', 'OLD_VALUE');
      return I.dontSeeInField('//input[@id="name"]', 'NOtVALUE');
    });

    it('should check textarea equals', function* () {
      yield I.amOnPage('/form/textarea');
      yield I.seeInField('Description', 'sunrise');
      yield I.seeInField('textarea', 'sunrise');
      yield I.seeInField('//textarea[@id="description"]', 'sunrise');
      return I.dontSeeInField('//textarea[@id="description"]', 'sunset');
    });

    it('should check checkbox is checked :)', function* () {
      yield I.amOnPage('/info');
      return I.seeCheckboxIsChecked('input[type=checkbox]');
    });

    it('should check checkbox is not checked', function* () {
      yield I.amOnPage('/form/checkbox');
      return I.dontSeeCheckboxIsChecked('#checkin');
    });

    it('should match fields with the same name', function* () {
      yield I.amOnPage('/form/example20');
      yield I.seeInField("//input[@name='txtName'][2]", 'emma');
      return I.seeInField("input[name='txtName']:nth-child(2)", 'emma');
    });
  });

  describe('#grabTextFrom, #grabValueFrom, #grabAttributeFrom', () => {
    it('should grab text from page', function* () {
      yield I.amOnPage('/');
      let val = yield I.grabTextFrom('h1');
      assert.equal(val, 'Welcome to test app!');
      val = yield I.grabTextFrom('//h1');
      return assert.equal(val, 'Welcome to test app!');
    });

    it('should grab multiple texts from page', function* () {
      yield I.amOnPage('/info');
      const vals = yield I.grabTextFrom('#grab-multiple a');
      assert.equal(vals[0], 'First');
      assert.equal(vals[1], 'Second');
      assert.equal(vals[2], 'Third');
    });

    it('should grab value from field', function* () {
      yield I.amOnPage('/form/hidden');
      let val = yield I.grabValueFrom('#action');
      assert.equal(val, 'kill_people');
      val = yield I.grabValueFrom("//form/input[@name='action']");
      assert.equal(val, 'kill_people');
      yield I.amOnPage('/form/textarea');
      val = yield I.grabValueFrom('#description');
      assert.equal(val, 'sunrise');
      yield I.amOnPage('/form/select');
      val = yield I.grabValueFrom('#age');
      return assert.equal(val, 'oldfag');
    });

    it('should grab attribute from element', function* () {
      yield I.amOnPage('/search');
      const val = yield I.grabAttributeFrom({
        css: 'form',
      }, 'method');
      return assert.equal(val, 'get');
    });

    it('should grab custom attribute from element', function* () {
      yield I.amOnPage('/form/example4');
      const val = yield I.grabAttributeFrom({
        css: '.navbar-toggle',
      }, 'data-toggle');
      return assert.equal(val, 'collapse');
    });
  });

  describe('page title : #seeTitle, #dontSeeTitle, #grabTitle', () => {
    it('should check page title', function* () {
      yield I.amOnPage('/');
      yield I.seeInTitle('TestEd Beta 2.0');
      yield I.dontSeeInTitle('Welcome to test app');
      yield I.amOnPage('/info');
      return I.dontSeeInTitle('TestEd Beta 2.0');
    });

    it('should grab page title', function* () {
      yield I.amOnPage('/');
      const val = yield I.grabTitle();
      return assert.equal(val, 'TestEd Beta 2.0');
    });
  });

  describe('#attachFile', () => {
    it('should upload file located by CSS', function* () {
      yield I.amOnPage('/form/file');
      yield I.attachFile('#avatar', 'app/avatar.jpg');
      yield I.click('Submit');
      yield I.amOnPage('/');
      formContents().files.should.have.key('avatar');
      formContents().files.avatar.name.should.eql('avatar.jpg');
      formContents().files.avatar.type.should.eql('image/jpeg');
    });

    it('should upload file located by label', function* () {
      if (isHelper('Nightmare')) return;
      yield I.amOnPage('/form/file');
      yield I.attachFile('Avatar', 'app/avatar.jpg');
      yield I.click('Submit');
      formContents().files.should.have.key('avatar');
      formContents().files.avatar.name.should.eql('avatar.jpg');
      formContents().files.avatar.type.should.eql('image/jpeg');
    });
  });

  describe('#saveScreenshot', () => {
    beforeEach(() => {
      global.output_dir = path.join(global.codecept_dir, 'output');
    });

    it('should create a screenshot file in output dir', () => {
      const sec = (new Date()).getUTCMilliseconds();
      return I.amOnPage('/')
        .then(() => I.saveScreenshot(`screenshot_${sec}.png`))
        .then(() => assert.ok(fileExists(path.join(global.output_dir, `screenshot_${sec}.png`)), null, 'file does not exists'));
    });

    it('should create a full page screenshot file in output dir', () => {
      const sec = (new Date()).getUTCMilliseconds();
      return I.amOnPage('/')
        .then(() => I.saveScreenshot(`screenshot_full_${+sec}.png`, true))
        .then(() => assert.ok(fileExists(path.join(global.output_dir, `screenshot_full_${+sec}.png`)), null, 'file does not exists'));
    });
  });

  describe('cookies : #setCookie, #clearCookies, #seeCookie', () => {
    it('should do all cookie stuff', () => I.amOnPage('/')
      .then(() => I.setCookie({
        name: 'auth',
        value: '123456',
      }))
      .then(() => I.seeCookie('auth'))
      .then(() => I.dontSeeCookie('auuth'))
      .then(() => I.grabCookie('auth'))
      .then(cookie => assert.equal(cookie.value, '123456'))
      .then(() => I.clearCookie('auth'))
      .then(() => I.dontSeeCookie('auth')));

    it('should clear all cookies', () => I.amOnPage('/')
      .then(() => I.setCookie({
        name: 'auth',
        value: '123456',
      }))
      .then(() => I.clearCookie())
      .then(() => I.dontSeeCookie('auth')));
  });

  describe('#waitForText', () => {
    it('should wait for text', () => I.amOnPage('/dynamic')
      .then(() => I.dontSee('Dynamic text'))
      .then(() => I.waitForText('Dynamic text', 2))
      .then(() => I.see('Dynamic text')));

    it('should wait for text in context', () => I.amOnPage('/dynamic')
      .then(() => I.dontSee('Dynamic text'))
      .then(() => I.waitForText('Dynamic text', 2, '#text'))
      .then(() => I.see('Dynamic text')));

    it('should fail if no context', () => {
      let failed = false;
      return I.amOnPage('/dynamic')
        .then(() => I.dontSee('Dynamic text'))
        .then(() => I.waitForText('Dynamic text', 1, '#fext'))
        .catch(err => failed = true)
        .then(() => assert.ok(failed));
    });

    it('should fail if text doesn\'t contain', () => {
      let failed = false;
      return I.amOnPage('/dynamic')
        .then(() => I.waitForText('Other text', 1))
        .catch(err => failed = true)
        .then(() => assert.ok(failed));
    });

    it('should fail if text is not in element', () => {
      let failed = false;
      return I.amOnPage('/dynamic')
        .then(() => I.waitForText('Other text', 1, '#text'))
        .catch(err => failed = true)
        .then(() => assert.ok(failed));
    });


    it('should wait for text after timeout', () => I.amOnPage('/timeout')
      .then(() => I.dontSee('Timeout text'))
      .then(() => I.waitForText('Timeout text', 31, '#text'))
      .then(() => I.see('Timeout text')));
  });

  describe('#waitForElement', () => {
    it('should wait for visible element', () => I.amOnPage('/form/wait_visible')
      .then(() => I.dontSee('Step One Button'))
      .then(() => I.dontSeeElement('#step_1'))
      .then(() => I.waitForVisible('#step_1', 2))
      .then(() => I.seeElement('#step_1'))
      .then(() => I.click('#step_1'))
      .then(() => I.waitForVisible('#step_2', 2))
      .then(() => I.see('Step Two Button')));

    it('should wait for element in DOM', () => I.amOnPage('/form/wait_visible')
      .then(() => I.waitForElement('#step_2'))
      .then(() => I.dontSeeElement('#step_2'))
      .then(() => I.seeElementInDOM('#step_2')));

    it('should wait for element by XPath', () => I.amOnPage('/form/wait_visible')
      .then(() => I.waitForElement('//div[@id="step_2"]'))
      .then(() => I.dontSeeElement('//div[@id="step_2"]'))
      .then(() => I.seeElementInDOM('//div[@id="step_2"]')));


    it('should wait for element to appear', () => I.amOnPage('/form/wait_element')
      .then(() => I.dontSee('Hello'))
      .then(() => I.dontSeeElement('h1'))
      .then(() => I.waitForElement('h1', 2))
      .then(() => I.see('Hello')));
  });

  describe('#waitForInvisible', () => {
    it('should wait for element to be invisible', () => I.amOnPage('/form/wait_invisible')
      .then(() => I.see('Step One Button'))
      .then(() => I.seeElement('#step_1'))
      .then(() => I.waitForInvisible('#step_1', 2))
      .then(() => I.dontSeeElement('#step_1')));

    it('should wait for element to be invisible by XPath', () => I.amOnPage('/form/wait_invisible')
      .then(() => I.seeElement('//div[@id="step_1"]'))
      .then(() => I.waitForInvisible('//div[@id="step_1"]'))
      .then(() => I.dontSeeElement('//div[@id="step_1"]'))
      .then(() => I.seeElementInDOM('//div[@id="step_1"]')));

    it('should wait for element to be removed', () => I.amOnPage('/form/wait_invisible')
      .then(() => I.see('Step Two Button'))
      .then(() => I.seeElement('#step_2'))
      .then(() => I.waitForInvisible('#step_2', 2))
      .then(() => I.dontSeeElement('#step_2')));

    it('should wait for element to be removed by XPath', () => I.amOnPage('/form/wait_invisible')
      .then(() => I.see('Step Two Button'))
      .then(() => I.seeElement('//div[@id="step_2"]'))
      .then(() => I.waitForInvisible('//div[@id="step_2"]', 2))
      .then(() => I.dontSeeElement('//div[@id="step_2"]')));
  });

  describe('#waitToHide', () => {
    it('should wait for element to be invisible', () => I.amOnPage('/form/wait_invisible')
      .then(() => I.see('Step One Button'))
      .then(() => I.seeElement('#step_1'))
      .then(() => I.waitToHide('#step_1', 2))
      .then(() => I.dontSeeElement('#step_1')));

    it('should wait for element to be invisible by XPath', () => I.amOnPage('/form/wait_invisible')
      .then(() => I.seeElement('//div[@id="step_1"]'))
      .then(() => I.waitToHide('//div[@id="step_1"]'))
      .then(() => I.dontSeeElement('//div[@id="step_1"]'))
      .then(() => I.seeElementInDOM('//div[@id="step_1"]')));

    it('should wait for element to be removed', () => I.amOnPage('/form/wait_invisible')
      .then(() => I.see('Step Two Button'))
      .then(() => I.seeElement('#step_2'))
      .then(() => I.waitToHide('#step_2', 2))
      .then(() => I.dontSeeElement('#step_2')));

    it('should wait for element to be removed by XPath', () => I.amOnPage('/form/wait_invisible')
      .then(() => I.see('Step Two Button'))
      .then(() => I.seeElement('//div[@id="step_2"]'))
      .then(() => I.waitToHide('//div[@id="step_2"]', 2))
      .then(() => I.dontSeeElement('//div[@id="step_2"]')));
  });

  describe('#waitForDetached', () => {
    it('should throw an error if the element still exists in DOM', () => I.amOnPage('/form/wait_detached')
      .then(() => I.see('Step One Button'))
      .then(() => I.seeElement('#step_1'))
      .then(() => I.waitForDetached('#step_1', 2))
      .then(() => {
        throw Error('Should not get this far');
      })
      .catch((err) => {
        err.message.should.include('still on page after');
      }));

    it('should throw an error if the element still exists in DOM by XPath', () => I.amOnPage('/form/wait_detached')
      .then(() => I.see('Step One Button'))
      .then(() => I.seeElement('#step_1'))
      .then(() => I.waitForDetached('#step_1', 2))
      .then(() => {
        throw Error('Should not get this far');
      })
      .catch((err) => {
        err.message.should.include('still on page after');
      }));

    it('should wait for element to be removed from DOM', () => I.amOnPage('/form/wait_detached')
      .then(() => I.see('Step Two Button'))
      .then(() => I.seeElement('#step_2'))
      .then(() => I.waitForDetached('#step_2', 2))
      .then(() => I.dontSeeElementInDOM('#step_2')));

    it('should wait for element to be removed from DOM by XPath', () => I.amOnPage('/form/wait_detached')
      .then(() => I.seeElement('//div[@id="step_2"]'))
      .then(() => I.waitForDetached('//div[@id="step_2"]'))
      .then(() => I.dontSeeElement('//div[@id="step_2"]'))
      .then(() => I.dontSeeElementInDOM('//div[@id="step_2"]')));
  });

  describe('within tests', () => {
    afterEach(() => I._withinEnd());

    it('should execute within block', () => I.amOnPage('/form/example4')
      .then(() => I.seeElement('#navbar-collapse-menu'))
      .then(() => I._withinBegin('#register'))
      .then(() => I.see('E-Mail'))
      .then(() => I.dontSee('Toggle navigation'))
      .then(() => I.dontSeeElement('#navbar-collapse-menu')));


    it('should respect form fields inside within block ', () => {
      let rethrow;
      return I.amOnPage('/form/example4')
        .then(() => I.seeElement('#navbar-collapse-menu'))
        .then(() => I.see('E-Mail'))
        .then(() => I.see('Hasło'))
        .then(() => I.fillField('Hasło', '12345'))
        .then(() => I.seeInField('Hasło', '12345'))
        .then(() => I.checkOption('terms'))
        .then(() => I.seeCheckboxIsChecked('terms'))
        .then(() => I._withinBegin({
          css: '.form-group',
        }))
        .then(() => I.see('E-Mail'))
        .then(() => I.dontSee('Hasło'))
        .then(() => I.dontSeeElement('#navbar-collapse-menu'))
        .catch(err => rethrow = err)
        .then(() => I.dontSeeCheckboxIsChecked('terms'))
        .catch((err) => {
          if (!err) assert.fail('seen checkbox');
        })
        .then(() => I.seeInField('Hasło', '12345'))
        .catch((err) => {
          if (!err) assert.fail('seen field');
        })
        .then(() => {
          if (rethrow) throw rethrow;
        });
    });

    it('should execute within block 2', () => I.amOnPage('/form/example4')
      .then(() => I.fillField('Hasło', '12345'))
      .then(() => I._withinBegin({
        xpath: '//div[@class="form-group"][2]',
      }))
      .then(() => I.dontSee('E-Mail'))
      .then(() => I.see('Hasło'))
      .then(() => I.grabTextFrom('label'))
      .then(label => assert.equal(label, 'Hasło'))
      .then(() => I.grabValueFrom('input'))
      .then(input => assert.equal(input, '12345')));

    it('within should respect context in see', () => I.amOnPage('/form/example4')
      .then(() => I.see('Rejestracja', 'fieldset'))
      .then(() => I._withinBegin({
        css: '.navbar-header',
      }))
      .then(() => I.see('Rejestracja', '.container fieldset'))
      .catch((err) => {
        if (!err) assert.fail('seen fieldset');
      })
      .then(() => I.see('Toggle navigation', '.container fieldset'))
      .catch((err) => {
        if (!err) assert.fail('seen fieldset');
      }));

    it('within should respect context in see when using nested frames', () => I.amOnPage('/iframe_nested')
      .then(() => I._withinBegin({
        frame: ['#wrapperId', '[name=content]'],
      }))
      .then(() => I.see('Kill & Destroy'))
      .catch((err) => {
        if (!err) assert.fail('seen "Kill & Destroy"');
      })
      .then(() => I.dontSee('Nested Iframe test'))
      .catch((err) => {
        if (!err) assert.fail('seen "Nested Iframe test"');
      })
      .then(() => I.dontSee('Iframe test'))
      .catch((err) => {
        if (!err) assert.fail('seen "Iframe test"');
      }));
  });

  describe('scroll: #scrollTo, #scrollPageToTop, #scrollPageToBottom', () => {
    it('should scroll inside an iframe', async () => {
      if (isHelper('Nightmare')) return;
      await I.amOnPage('/iframe');
      await I.resizeWindow(500, 700);
      await I.switchTo(0);

      const { x, y } = await I.grabPageScrollPosition();
      await I.scrollTo('.sign');
      const { x: afterScrollX, y: afterScrollY } = await I.grabPageScrollPosition();
      assert.notEqual(afterScrollY, y);
      assert.equal(afterScrollX, x);
    });

    it('should scroll to an element', async () => {
      await I.amOnPage('/form/scroll');
      await I.resizeWindow(500, 700);
      const { x, y } = await I.grabPageScrollPosition();
      await I.scrollTo('.section3 input[name="test"]');
      const { x: afterScrollX, y: afterScrollY } = await I.grabPageScrollPosition();
      assert.notEqual(afterScrollY, y);
    });

    it('should scroll to coordinates', async () => {
      await I.amOnPage('/form/scroll');
      await I.resizeWindow(500, 700);
      const { x, y } = await I.grabPageScrollPosition();
      await I.scrollTo(50, 70);
      const { x: afterScrollX, y: afterScrollY } = await I.grabPageScrollPosition();
      assert.equal(afterScrollX, 50);
      assert.equal(afterScrollY, 70);
    });

    it('should scroll to bottom of page', async () => {
      await I.amOnPage('/form/scroll');
      await I.resizeWindow(500, 700);
      const { y } = await I.grabPageScrollPosition();
      await I.scrollPageToBottom();
      const { y: afterScrollY } = await I.grabPageScrollPosition();
      assert.notEqual(afterScrollY, y);
      assert.notEqual(afterScrollY, 0);
    });

    it('should scroll to top of page', async () => {
      await I.amOnPage('/form/scroll');
      await I.resizeWindow(500, 700);
      await I.scrollPageToBottom();
      const { y } = await I.grabPageScrollPosition();

      await I.scrollPageToTop();
      const { y: afterScrollY } = await I.grabPageScrollPosition();
      assert.notEqual(afterScrollY, y);
      assert.equal(afterScrollY, 0);
    });
  });

  describe('#grabCssPropertyFrom', () => {
    it('should grab css property for given element', async () => {
      if (isHelper('Nightmare')) return;
      await I.amOnPage('/form/doubleclick');
      const css = await I.grabCssPropertyFrom('#block', 'height');
      assert.equal(css, '100px');
    });
  });

  describe('#seeAttributesOnElements', () => {
    it('should check attributes values for given element', async () => {
      if (isHelper('Nightmare')) return;
      try {
        await I.amOnPage('/info');
        await I.seeAttributesOnElements('//form', {
          method: 'post',
        });
        await I.seeAttributesOnElements('//form', {
          method: 'post',
          action: `${siteUrl}/`,
        });
        await I.seeAttributesOnElements('//form', {
          method: 'get',
        });
        throw Error('It should never get this far');
      } catch (e) {
        e.message.should.include('all elements (//form) to have attributes {"method":"get"}');
      }
    });

    it('should check attributes values for several elements', async () => {
      if (isHelper('Nightmare')) return;
      try {
        await I.amOnPage('/');
        await I.seeAttributesOnElements('a', {
          'qa-id': 'test',
          'qa-link': 'test',
        });
        await I.seeAttributesOnElements('//div', {
          'qa-id': 'test',
        });
        await I.seeAttributesOnElements('a', {
          'qa-id': 'test',
          href: '/info',
        });
        throw new Error('It should never get this far');
      } catch (e) {
        e.message.should.include('all elements (a) to have attributes {"qa-id":"test","href":"/info"}');
      }
    });
  });

  describe('#seeCssPropertiesOnElements', () => {
    it('should check css property for given element', async () => {
      if (isHelper('Nightmare')) return;
      try {
        await I.amOnPage('/info');
        await I.seeCssPropertiesOnElements('h3', {
          'font-weight': 'bold',
        });
        await I.seeCssPropertiesOnElements('h3', {
          'font-weight': 'bold',
          display: 'block',
        });
        await I.seeCssPropertiesOnElements('h3', {
          'font-weight': 'non-bold',
        });
        throw Error('It should never get this far');
      } catch (e) {
        e.message.should.include('expected all elements (h3) to have CSS property {"font-weight":"non-bold"}');
      }
    });


    it('should check css property for several elements', async () => {
      if (isHelper('Nightmare')) return;
      try {
        await I.amOnPage('/');
        await I.seeCssPropertiesOnElements('a', {
          color: 'rgb(0, 0, 238)',
          cursor: 'pointer',
        });
        await I.seeCssPropertiesOnElements('a', {
          color: '#0000EE',
          cursor: 'pointer',
        });
        await I.seeCssPropertiesOnElements('//div', {
          display: 'block',
        });
        await I.seeCssPropertiesOnElements('a', {
          'margin-top': '0em',
          cursor: 'pointer',
        });
        throw Error('It should never get this far');
      } catch (e) {
        e.message.should.include('expected all elements (a) to have CSS property {"margin-top":"0em","cursor":"pointer"}');
      }
    });

    it('should normalize css color properties for given element', async () => {
      if (isHelper('Nightmare')) return;

      await I.amOnPage('/form/css_colors');
      await I.seeCssPropertiesOnElements('#namedColor', {
        'background-color': 'purple',
        color: 'yellow',
      });
      await I.seeCssPropertiesOnElements('#namedColor', {
        'background-color': '#800080',
        color: '#ffff00',
      });

      await I.seeCssPropertiesOnElements('#namedColor', {
        'background-color': 'rgb(128,0,128)',
        color: 'rgb(255,255,0)',
      });

      await I.seeCssPropertiesOnElements('#namedColor', {
        'background-color': 'rgba(128,0,128,1)',
        color: 'rgba(255,255,0,1)',
      });
    });
  });
};
