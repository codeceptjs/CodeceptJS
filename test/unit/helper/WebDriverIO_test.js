'use strict';

let WebDriverIO = require('../../../lib/helper/WebDriverIO');
let should = require('chai').should();
let wd;
let site_url = 'http://127.0.0.1:8000';
let assert = require('assert');
let path = require('path');
let fs = require('fs');
let fileExists = require('../../../lib/utils').fileExists;
let AssertionFailedError = require('../../../lib/assert/error');
let formContents = require('../../../lib/utils').test.submittedData(path.join(__dirname, '../../data/app/db'));
let expectError = require('../../../lib/utils').test.expectError;


describe('WebDriverIO', function () {
  this.timeout(10000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '../../data');
    try {
      fs.unlinkSync(dataFile);
    } catch (err) {}

    wd = new WebDriverIO({
      url: site_url,
      browser: 'firefox'
    });
  });

  beforeEach(() => {
    return wd._before();
  });

  afterEach(() => {
    return wd._after();
  });

  describe('open page : #amOnPage', () => {
    it('should open main page of configured site', () => {
      return wd.amOnPage('/').getUrl().then((url) => {
        return url.should.eql(site_url + '/');
      });
    });

    it('should open any page of configured site', () => {
      return wd.amOnPage('/info').getUrl().then((url) => {
        return url.should.eql(site_url + '/info');
      });
    });

    it('should open absolute url', () => {
      return wd.amOnPage(site_url).getUrl().then((url) => {
        return url.should.eql(site_url + '/');
      });
    });
  });

  describe('current url : #seeInCurrentUrl, #seeCurrentUrlEquals, ...', () => {
    it('should check for url fragment', () => {
      return wd.amOnPage('/form/checkbox')
        .then(() => wd.seeInCurrentUrl('/form'))
        .then(() => wd.dontSeeInCurrentUrl('/user'));
    });

    it('should check for equality', () => {
      return wd.amOnPage('/info')
        .then(() => wd.seeCurrentUrlEquals('/info'))
        .then(() => wd.dontSeeCurrentUrlEquals('form'));
    });

    it('should check for equality in absulute urls', () => {
      return wd.amOnPage('/info')
        .then(() => wd.seeCurrentUrlEquals(site_url + '/info'))
        .then(() => wd.dontSeeCurrentUrlEquals(site_url + '/form'));
    });
  });

  describe('see text : #see', () => {
    it('should check text on site', () => {
      return wd.amOnPage('/')
        .then(() => wd.see('Welcome to test app!'))
        .then(() => wd.see('A wise man said: "debug!"'))
        .then(() => wd.dontSee('Info'));
    });

    it('should fail when text is not on site', () => {
      return wd.amOnPage('/')
        .then(() => wd.see('Something incredible!'))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('web page');
        })
        .then(() => wd.dontSee('Welcome'))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.include('web page');
        });
    });

    it('should check text inside element', () => {
      return wd.amOnPage('/')
        .then(() => wd.see('Welcome to test app!', 'h1'))
        .then(() => wd.amOnPage('/info'))
        .then(() => wd.see('valuable', { css: 'p'}))
        .then(() => wd.see('valuable', '//body/p'))
        .then(() => wd.dontSee('valuable', 'h1'));
    });

    it('should verify non-latin chars', () => {
      return wd.amOnPage('/info')
        .then(() => wd.see('на'))
        .then(() => wd.see("Don't do that at home!", 'h3'))
        .then(() => wd.see('Текст', 'p'));
    });
  });

  describe('see element : #seeElement, #dontSeeElement', () => {
    it('should check visible elements on page', () => {
      return wd.amOnPage('/form/field')
        .then(() => wd.seeElement('input[name=name]'))
        .then(() => wd.seeElement('//input[@id="name"]'))
        .then(() => wd.dontSeeElement('#something-beyond'))
        .then(() => wd.dontSeeElement('//input[@id="something-beyond"]'));
    });
  });

  describe('#click', () => {
    it('should click by inner text', () => {
      return wd.amOnPage('/')
        .then(() => wd.click('More info'))
        .then(() => wd.seeInCurrentUrl('/info'));
    });

    it('should click by css', () => {
      return wd.amOnPage('/')
        .then(() => wd.click('#link'))
        .then(() => wd.seeInCurrentUrl('/info'));
    });

    it('should click by xpath', () => {
      return wd.amOnPage('/')
        .then(() => wd.click('//a[@id="link"]'))
        .then(() => wd.seeInCurrentUrl('/info'));
    });

    it('should click by name', () => {
      return wd.amOnPage('/form/button')
        .then(() => wd.click('btn0'))
        .then(() => assert.equal(formContents('text'), 'val'));
    });

    it('should click on context', () => {
      return wd.amOnPage('/')
        .then(() => wd.click('More info', 'body>p'))
        .then(() => wd.seeInCurrentUrl('/info'));
    });

    it('should click link with inner span', () => {
      return wd.amOnPage('/form/example7')
        .then(() => wd.click('Buy Chocolate Bar'))
        .then(() => wd.seeInCurrentUrl('/'));
    });
  });

  describe('#checkOption', () => {

    it('should check option by css', () => {
      return wd.amOnPage('/form/checkbox')
        .then(() => wd.checkOption('#checkin'))
        .then(() => wd.click('Submit'))
        .then(() => assert.equal(formContents('terms'), 'agree'));
    });

    it('should check option by strict locator', () => {
      return wd.amOnPage('/form/checkbox')
        .then(() => wd.checkOption({id: 'checkin'}))
        .then(() => wd.click('Submit'))
        .then(() => assert.equal(formContents('terms'), 'agree'));
    });

    it('should check option by name', () => {
      return wd.amOnPage('/form/checkbox')
        .then(() => wd.checkOption('terms'))
        .then(() => wd.click('Submit'))
        .then(() => assert.equal(formContents('terms'), 'agree'));
    });

    it('should check option by label', () => {
      return wd.amOnPage('/form/checkbox')
        .then(() => wd.checkOption('I Agree'))
        .then(() => wd.click('Submit'))
        .then(() => assert.equal(formContents('terms'), 'agree'));
    });

    it('should check option by context', () => {
      return wd.amOnPage('/form/example1')
        .then(() => wd.checkOption('Remember me next time', '.rememberMe'))
        .then(() => wd.click('Login'))
        .then(() => assert.equal(formContents('LoginForm')['rememberMe'], 1));
    });
  });

  describe('#selectOption', () => {
    it('should select option by css', () => {
      return wd.amOnPage('/form/select')
        .then(() => wd.selectOption('form select[name=age]', 'adult'))
        .then(() => wd.click('Submit'))
        .then(() => assert.equal(formContents('age'), 'adult'));
    });

    it('should select option by name', () => {
      return wd.amOnPage('/form/select')
        .then(() => wd.selectOption('age', 'adult'))
        .then(() => wd.click('Submit'))
        .then(() => assert.equal(formContents('age'), 'adult'));
    });

    it('should select option by label', () => {
      return wd.amOnPage('/form/select')
        .then(() => wd.selectOption('Select your age', 'dead'))
        .then(() => wd.click('Submit'))
        .then(() => assert.equal(formContents('age'), 'dead'));
    });

    it('should select option by label and option text', () => {
      return wd.amOnPage('/form/select')
        .then(() => wd.selectOption('Select your age', '21-60'))
        .then(() => wd.click('Submit'))
        .then(() => assert.equal(formContents('age'), 'adult'));
    });

    it('should select multiple options', () => {
      return wd.amOnPage('/form/select_multiple')
        .then(() => wd.selectOption('What do you like the most?', ['Play Video Games', 'Have Sex']))
        .then(() => wd.click('Submit'))
        .then(() => assert.deepEqual(formContents('like'), ['play', 'adult']));
    });
  });

  describe('#fillField, #appendField', () => {
    it('should fill input fields', () => {
      return wd.amOnPage('/form/field')
        .then(() => wd.fillField('Name', 'Nothing special'))
        .then(() => wd.click('Submit'))
        .then(() => assert.equal(formContents('name'), 'Nothing special'));
    });

    it('should fill field by css', () => {
      return wd.amOnPage('/form/field')
        .then(() => wd.fillField('#name', 'Nothing special'))
        .then(() => wd.click('Submit'))
        .then(() => assert.equal(formContents('name'), 'Nothing special'));
    });

    it('should fill field by strict locator', () => {
      return wd.amOnPage('/form/field')
        .then(() => wd.fillField({id: 'name'}, 'Nothing special'))
        .then(() => wd.click('Submit'))
        .then(() => assert.equal(formContents('name'), 'Nothing special'));
    });

    it('should fill field by name', () => {
      return wd.amOnPage('/form/example1')
        .then(() => wd.fillField('LoginForm[username]', 'davert'))
        .then(() => wd.fillField('LoginForm[password]', '123456'))
        .then(() => wd.click('Login'))
        .then(() => assert.equal(formContents('LoginForm')['username'], 'davert'))
        .then(() => assert.equal(formContents('LoginForm')['password'], '123456'));
    });

    it('should fill textarea by css', () => {
      return wd.amOnPage('/form/textarea')
        .then(() => wd.fillField('textarea', 'Nothing special'))
        .then(() => wd.click('Submit'))
        .then(() => assert.equal(formContents('description'), 'Nothing special'));
    });

    it('should fill textarea by label', () => {
      return wd.amOnPage('/form/textarea')
        .then(() => wd.fillField('Description', 'Nothing special'))
        .then(() => wd.click('Submit'))
        .then(() => assert.equal(formContents('description'), 'Nothing special'));
    });

    it('should append field value', () => {
      return wd.amOnPage('/form/field')
        .then(() => wd.appendField('Name', '_AND_NEW'))
        .then(() => wd.click('Submit'))
        .then(() => assert.equal(formContents('name'), 'OLD_VALUE_AND_NEW'));
    });

    it('should be able to send special keys to element', () => {
      return wd.amOnPage('/form/field')
        .then(() => wd.appendField('Name', '-'))
        .then(() => wd.pressKey([`Control`, `a`]))
        .then(() => wd.pressKey([`Delete`]))
        .then(() => wd.pressKey(['Shift', '111']))
        .then(() => wd.pressKey('1'))
        .then(() => wd.seeInField('Name', '!!!1'));
    });
  });

  describe('check fields: #seeInField, #seeCheckboxIsChecked, ...', () => {
    it('should check for empty field', () => {
      return wd.amOnPage('/form/empty')
        .then(() => wd.seeInField('#empty_input', ''));
    });

    it('should throw error if field is not empty', () => {
      return wd.amOnPage('/form/empty')
        .then(() => wd.seeInField('#empty_input', 'Ayayay'))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.be.equal('expected fields by #empty_input to include Ayayay');
        });
    });

    it('should check for empty textarea', () => {
      return wd.amOnPage('/form/empty')
        .then(() => wd.seeInField('#empty_textarea', ''));
    });

    it('should check field equals', () => {
      return wd.amOnPage('/form/field')
        .then(() => wd.seeInField('Name', 'OLD_VALUE'))
        .then(() => wd.seeInField('name', 'OLD_VALUE'))
        .then(() => wd.seeInField('//input[@id="name"]', 'OLD_VALUE'))
        .then(() => wd.dontSeeInField('//input[@id="name"]', 'NOtVALUE'));
    });

    it('should check textarea equals', () => {
      return wd.amOnPage('/form/textarea')
      .then(() => wd.seeInField('Description', 'sunrise'))
        .then(() => wd.seeInField('textarea', 'sunrise'))
        .then(() => wd.seeInField('//textarea[@id="description"]', 'sunrise'))
        .then(() => wd.dontSeeInField('//textarea[@id="description"]', 'sunset'));
    });

    it('should check values in checkboxes', () => {
      return wd.amOnPage('/form/field_values')
        .then(() => wd.dontSeeInField('checkbox[]', 'not seen one'))
        .then(() => wd.seeInField('checkbox[]', 'see test one'))
        .then(() => wd.dontSeeInField('checkbox[]', 'not seen two'))
        .then(() => wd.seeInField('checkbox[]', 'see test two'))
        .then(() => wd.dontSeeInField('checkbox[]', 'not seen three'))
        .then(() => wd.seeInField('checkbox[]', 'see test three'));
    });

    it('should check values with boolean', () => {
      return wd.amOnPage('/form/field_values')
        .then(() => wd.seeInField('checkbox1', true))
        .then(() => wd.dontSeeInField('checkbox1', false))
        .then(() => wd.seeInField('checkbox2', false))
        .then(() => wd.dontSeeInField('checkbox2', true))
        .then(() => wd.seeInField('radio2', true))
        .then(() => wd.dontSeeInField('radio2', false))
        .then(() => wd.seeInField('radio3', false))
        .then(() => wd.dontSeeInField('radio3', true));
    });

    it('should check values in radio', () => {
      return wd.amOnPage('/form/field_values')
        .then(() => wd.seeInField('radio1', 'see test one'))
        .then(() => wd.dontSeeInField('radio1', 'not seen one'))
        .then(() => wd.dontSeeInField('radio1', 'not seen two'))
        .then(() => wd.dontSeeInField('radio1', 'not seen three'));
    });

    it('should check values in select', () => {
      return wd.amOnPage('/form/field_values')
        .then(() => wd.seeInField('select1', 'see test one'))
        .then(() => wd.dontSeeInField('select1', 'not seen one'))
        .then(() => wd.dontSeeInField('select1', 'not seen two'))
        .then(() => wd.dontSeeInField('select1', 'not seen three'));
    });

    it('should check for empty select field', () => {
      return wd.amOnPage('/form/field_values')
        .then(() => wd.seeInField('select3', ''));
    });

    it('should check for select multiple field', () => {
      return wd.amOnPage('/form/field_values')
        .then(() => wd.dontSeeInField('select2', 'not seen one'))
        .then(() => wd.seeInField('select2', 'see test one'))
        .then(() => wd.dontSeeInField('select2', 'not seen two'))
        .then(() => wd.seeInField('select2', 'see test two'))
        .then(() => wd.dontSeeInField('select2', 'not seen three'))
        .then(() => wd.seeInField('select2', 'see test three'));
    });

    it('should check checkbox is checked :)', () => {
      return wd.amOnPage('/info')
        .then(() => wd.seeCheckboxIsChecked('input[type=checkbox]'));
    });

    it('should check checkbox is not checked', () => {
      return wd.amOnPage('/form/checkbox')
        .then(() => wd.dontSeeCheckboxIsChecked('#checkin'));
    });
  });

  describe('#grabHTMLFrom', () => {
    it('should grab html from element', () => {
      return wd.amOnPage('/')
        .then(() => wd.grabTextFrom('#area3'))
        .then((val) => assert.equal(val, '<a href="info">Document-Relative Link</a>'));
    });
  }

  describe('#grabTextFrom, #grabValueFrom, #grabAttribute', () => {
    it('should grab text from page', () => {
      return wd.amOnPage('/')
        .then(() => wd.grabTextFrom('h1'))
        .then((val) => assert.equal(val, "Welcome to test app!"))
        .then(() => wd.grabTextFrom('//h1'))
        .then((val) => assert.equal(val, "Welcome to test app!"));
    });

    it('should grab value from field', () => {
      return wd.amOnPage('/form/hidden')
        .then(() => wd.grabValueFrom('#action'))
        .then((val) => assert.equal(val, "kill_people"))
        .then(() => wd.grabValueFrom("//form/input[@name='action']"))
        .then((val) => assert.equal(val, "kill_people"))
        .then(() => wd.amOnPage('/form/textarea'))
        .then(() => wd.grabValueFrom('#description'))
        .then((val) => assert.equal(val, "sunrise"))
        .then(() => wd.amOnPage('/form/select'))
        .then(() => wd.grabValueFrom('#age'))
        .then((val) => assert.equal(val, "oldfag"));
    });

    it('should grab attribute from element', () => {
      return wd.amOnPage('/search')
        .then(() => wd.grabAttribute({css: 'form'}, 'method'))
        .then((val) => assert.equal(val, "get"));
    });
  });

  describe('page title : #seeTitle, #dontSeeTitle, #grabTitle', () => {
    it('should check page title', () => {
      return wd.amOnPage('/')
        .then(() => wd.seeInTitle('TestEd Beta 2.0'))
        .then(() => wd.dontSeeInTitle('Welcome to test app'))
        .then(() => wd.amOnPage('/info'))
        .then(() => wd.dontSeeInTitle('TestEd Beta 2.0'));
    });

    it('should grab page title', () => {
      return wd.amOnPage('/')
        .then(() => wd.grabTitle())
        .then((val) => assert.equal(val, "TestEd Beta 2.0"));
    });
  });

  describe('#attachFile', () => {
    it('should upload file located by CSS', () => {
      return wd.amOnPage('/form/file')
        .then(() => wd.attachFile('#avatar', 'app/avatar.jpg'))
        .then(() => wd.click('Submit'))
        .then(() => formContents()['files'].should.have.key('avatar'));
    });

    it('should upload file located by label', () => {
      return wd.amOnPage('/form/file')
        .then(() => wd.attachFile('Avatar', 'app/avatar.jpg'))
        .then(() => wd.click('Submit'))
        .then(() => formContents()['files'].should.have.key('avatar'));
    });
  });

  describe('#saveScreenshot', () => {
    beforeEach(() => {
      global.output_dir = path.join(global.codecept_dir, 'output');
    });

    it('should create a screenshot file in output dir', () => {
      return wd.amOnPage('/')
        .then(() => wd.saveScreenshot('user.png'))
        .then(() => assert.ok(fileExists(path.join(output_dir, 'user.png')), null, 'file does not exists'));
    });

    it('should create a screenshot file in output dir', () => {
      let test = { name: 'should do smth' };
      return wd.amOnPage('/')
        .then(() => wd._failed(test))
        .then(() => assert.ok(fileExists(path.join(output_dir, 'should_do_smth.failed.png')), null, 'file does not exists'));
    });
  });

  describe('cookies : #setCookie, #clearCookies, #seeCookie', () => {
    it('should do all cookie stuff', () => {
      return wd.amOnPage('/')
        .then(() => wd.setCookie({name: 'auth', value: '123456'}))
        .then(() => wd.seeCookie('auth'))
        .then(() => wd.dontSeeCookie('auuth'))
        .then(() => wd.grabCookie('auth'))
        .then((cookie) => assert.equal(cookie.value, '123456'))
        .then(() => wd.clearCookie('auth'))
        .then(() => wd.dontSeeCookie('auth'));
    });
  });

  describe('#seeInSource', () => {
    it('should check for text to be in HTML source', () => {
      return wd.amOnPage('/')
        .then(() => wd.seeInSource('<title>TestEd Beta 2.0</title>'))
        .then(() => wd.dontSeeInSource('<meta'));
    });
  });

  describe('window size : #resizeWindow', () => {
    it('should change the active window size', () => {
      return wd.amOnPage('/')
        .then(() => wd.resizeWindow(640, 480))
        .then(function () { return this.windowHandleSize((err, size) => {
          assert.equal(size.value.width, 640);
          return assert.equal(size.value.height, 480);
        });
      });
    });
  });

  describe('popup : #acceptPopup, #seeInPopup, #cancelPopup', () => {
    it('should accept popup window', () => {
      return wd.amOnPage('/form/popup')
        .then(() => wd.click('Confirm'))
        .then(() => wd.acceptPopup())
        .then(() => wd.see('Yes', '#result'));
    });

    it('should cancel popup', () => {
      return wd.amOnPage('/form/popup')
        .then(() => wd.click('Confirm'))
        .then(() => wd.cancelPopup())
        .then(() => wd.see('No', '#result'));
    });

    it('should check text in popup', () => {
      return wd.amOnPage('/form/popup')
        .then(() => wd.click('Alert'))
        .then(() => wd.seeInPopup('Really?'))
        .then(() => wd.cancelPopup());
    });
  });

  describe('#waitForText', () => {
    it('should wait for text', () => {
      return wd.amOnPage('/dynamic')
        .then(() => wd.dontSee('Dynamic text'))
        .then(() => wd.waitForText('Dynamic text', 2))
        .then(() => wd.see('Dynamic text'));
    });

    it('should wait for text in context', () => {
      return wd.amOnPage('/dynamic')
        .then(() => wd.dontSee('Dynamic text'))
        .then(() => wd.waitForText('Dynamic text', 2, '#text'))
        .then(() => wd.see('Dynamic text'));
    });

    it('should return error if not present', () => {
      return wd.amOnPage('/dynamic')
        .then(() => wd.waitForText('Nothing here', 0, '#text'))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.be.equal('expected element #text to include Nothing here');
        });
    });

    it('should return error if waiting is too small', () => {
      return wd.amOnPage('/dynamic')
        .then(() => wd.waitForText('Dynamic text', 0.5))
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.be.equal('expected element body to include Dynamic text');
        });
    });
  });

  describe('#waitToHide', () => {
    it('should until element is not visible', () => {
      return wd.amOnPage('/')
        .then(() => wd.click('More info'))
        .then(() => wd.waitToHide('#area1'))
        .then(() => wd.seeInCurrentUrl('/info'));
    });
  });

  describe('#seeNumberOfElements', () => {
    it('should return 1 as count', () => {
      return wd.amOnPage('/')
        .then(() => wd.seeNumberOfElements('#area1', 1));
    });
  });

});
