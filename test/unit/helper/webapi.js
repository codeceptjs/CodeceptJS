'use strict';
require('co-mocha')(require('mocha'));

let I, data, site_url;
let assert = require('assert');
let path = require('path');
let formContents = require('../../../lib/utils').test.submittedData(path.join(__dirname, '../../data/app/db'));
let should = require('chai').should();
let fileExists = require('../../../lib/utils').fileExists;

module.exports.init = function(testData)
{
  data = testData;
}

module.exports.tests = function() {

  beforeEach(function() {
    I = data.I;
    site_url = data.site_url;
  });

  describe('current url : #seeInCurrentUrl, #seeCurrentUrlEquals, ...', () => {
    it('should check for url fragment', function*() {
      yield I.amOnPage('/form/checkbox');
      yield I.seeInCurrentUrl('/form');
      return I.dontSeeInCurrentUrl('/user');
    });

    it('should check for equality', function*() {
      yield I.amOnPage('/info');
      yield I.seeCurrentUrlEquals('/info');
      return I.dontSeeCurrentUrlEquals('form');
    });

    it('should check for equality in absulute urls', function*() {
      yield I.amOnPage('/info');
      yield I.seeCurrentUrlEquals(site_url + '/info');
      return I.dontSeeCurrentUrlEquals(site_url + '/form');
    });
  });

  describe('see text : #see', () => {
    it('should check text on site', function*() {
      yield I.amOnPage('/')
      yield I.see('Welcome to test app!');
      yield I.see('A wise man said: "debug!"');
      return I.dontSee('Info');
    });

    it('should check text inside element', function*() {
      yield I.amOnPage('/');
      yield I.see('Welcome to test app!', 'h1');
      yield I.amOnPage('/info');
      yield I.see('valuable', { css: 'p'});
      yield I.see('valuable', '//body/p');
      return I.dontSee('valuable', 'h1');
    });

    it('should verify non-latin chars', function*() {
      yield I.amOnPage('/info');
      yield I.see('на');
      yield I.see("Don't do that at home!", 'h3');
      return I.see('Текст', 'p');
    });
  });

  describe('see element : #seeElement, #seeElementInDOM, #dontSeeElement', () => {
    it('should check visible elements on page', function*() {
      yield I.amOnPage('/form/field');
      yield I.seeElement('input[name=name]');
      yield I.seeElement({name: 'name'});
      yield I.seeElement('//input[@id="name"]');
      yield I.dontSeeElement('#something-beyond');
      return I.dontSeeElement('//input[@id="something-beyond"]');
    });

    it('should check elements are in the DOM', function*() {
      yield I.amOnPage('/form/field');
      yield I.seeElementInDOM('input[name=name]');
      yield I.seeElementInDOM('//input[@id="name"]');
      yield I.dontSeeElementInDOM('#something-beyond');
      return I.dontSeeElementInDOM('//input[@id="something-beyond"]');
    });

    it('should check elements are visible on the page', function*() {
      yield I.amOnPage('/form/field');
      yield I.seeElementInDOM('input[name=email]');
      yield I.dontSeeElement('input[name=email]');
      return I.dontSeeElement('#something-beyond');
    });
  });

  describe('#click', () => {
    it('should click by inner text', function*() {
      yield I.amOnPage('/');
      yield I.click('More info');
      return I.seeInCurrentUrl('/info');
    });

    it('should click by css', function*() {
      yield I.amOnPage('/');
      yield I.click('#link');
      return I.seeInCurrentUrl('/info');
    });

    it('should click by xpath', function*() {
      yield I.amOnPage('/');
      yield I.click('//a[@id="link"]');
      return I.seeInCurrentUrl('/info');
    });

    it('should click by name', function*() {
      yield I.amOnPage('/form/button');
      yield I.click('btn0');
      return assert.equal(formContents('text'), 'val');
    });

    it('should click on context', function*() {
      yield I.amOnPage('/');
      yield I.click('More info', 'body>p');
      return I.seeInCurrentUrl('/info');
    });

    it('should click link with inner span', function*() {
      yield I.amOnPage('/form/example7');
      yield I.click('Buy Chocolate Bar');
      return I.seeInCurrentUrl('/');
    });
  });

  describe.only('#checkOption', () => {
    it('should check option by css', function*() {
      yield I.amOnPage('/form/checkbox')
      yield I.checkOption('#checkin');
      yield I.click('Submit');
      return assert.equal(formContents('terms'), 'agree');
    });

    it('should check option by strict locator', function*() {
      yield I.amOnPage('/form/checkbox')
      yield I.checkOption({id: 'checkin'});
      yield I.click('Submit');
      return assert.equal(formContents('terms'), 'agree');
    });

    it('should check option by name', function*() {
      yield I.amOnPage('/form/checkbox')
      yield I.checkOption('terms');
      yield I.click('Submit');
      return assert.equal(formContents('terms'), 'agree');
    });

    it('should check option by label', function*() {
      yield I.amOnPage('/form/checkbox')
      yield I.checkOption('I Agree');
      yield I.click('Submit');
      return assert.equal(formContents('terms'), 'agree');
    });

    it('should check option by context', function*() {
      yield I.amOnPage('/form/example1')
      yield I.checkOption('Remember me next time', '.rememberMe');
      yield I.click('Login');
      return assert.equal(formContents('LoginForm')['rememberMe'], 1);
    });
  });

  describe('#selectOption', () => {
    it('should select option by css', function*() {
      yield I.amOnPage('/form/select');
      yield I.selectOption('form select[name=age]', 'adult');
      yield I.click('Submit');
      return assert.equal(formContents('age'), 'adult');
    });

    it('should select option by name', function*() {
      yield I.amOnPage('/form/select');
      yield I.selectOption('age', 'adult');
      yield I.click('Submit');
      return assert.equal(formContents('age'), 'adult');
    });

    it('should select option by label', function*() {
      yield I.amOnPage('/form/select');
      yield I.selectOption('Select your age', 'dead');
      yield I.click('Submit');
      return assert.equal(formContents('age'), 'dead');
    });

    it('should select option by label and option text', function*() {
      yield I.amOnPage('/form/select');
      yield I.selectOption('Select your age', '21-60');
      yield I.click('Submit');
      return assert.equal(formContents('age'), 'adult');
    });

    it('should select multiple options', function*() {
      yield I.amOnPage('/form/select_multiple');
      yield I.selectOption('What do you like the most?', ['Play Video Games', 'Have Sex']);
      yield I.click('Submit');
      return assert.deepEqual(formContents('like'), ['play', 'adult']);
    });
  });

  describe('#fillField, #appendField', () => {
    it('should fill input fields', function*() {
      yield I.amOnPage('/form/field');
      yield I.fillField('Name', 'Nothing special');
      yield I.click('Submit');
      return assert.equal(formContents('name'), 'Nothing special');
    });

    it('should fill field by css', function*() {
      yield I.amOnPage('/form/field');
      yield I.fillField('#name', 'Nothing special');
      yield I.click('Submit');
      return assert.equal(formContents('name'), 'Nothing special');
    });

    it('should fill field by strict locator', function*() {
      yield I.amOnPage('/form/field');
      yield I.fillField({id: 'name'}, 'Nothing special');
      yield I.click('Submit');
      return assert.equal(formContents('name'), 'Nothing special');
    });

    it('should fill field by name', function*() {
      yield I.amOnPage('/form/example1');
      yield I.fillField('LoginForm[username]', 'davert');
      yield I.fillField('LoginForm[password]', '123456');
      yield I.click('Login');
      assert.equal(formContents('LoginForm')['username'], 'davert');
      return assert.equal(formContents('LoginForm')['password'], '123456');
    });

    it('should fill textarea by css', function*() {
      yield I.amOnPage('/form/textarea');
      yield I.fillField('textarea', 'Nothing special');
      yield I.click('Submit');
      return assert.equal(formContents('description'), 'Nothing special');
    });

    it('should fill textarea by label', function*() {
      yield I.amOnPage('/form/textarea');
      yield I.fillField('Description', 'Nothing special');
      yield I.click('Submit');
      return assert.equal(formContents('description'), 'Nothing special');
    });

    it('should append field value', function*() {
      yield I.amOnPage('/form/field');
      yield I.appendField('Name', '_AND_NEW');
      yield I.click('Submit');
      return assert.equal(formContents('name'), 'OLD_VALUE_AND_NEW');
    });

    it('should be able to send special keys to element', function*() {
      yield I.amOnPage('/form/field');
      yield I.appendField('Name', '-');
      yield I.pressKey([`Control`, `a`]);
      yield I.pressKey([`Delete`]);
      yield I.pressKey(['Shift', '111']);
      yield I.pressKey('1');
      return I.seeInField('Name', '!!!1');
    });
  });

  describe('check fields: #seeInField, #seeCheckboxIsChecked, ...', () => {
    it('should check for empty field', function*() {
      yield I.amOnPage('/form/empty')
      return I.seeInField('#empty_input', '');
    });

    it('should check for empty textarea', function*() {
      yield I.amOnPage('/form/empty')
      return I.seeInField('#empty_textarea', '');
    });

    it('should check field equals', function*() {
      yield I.amOnPage('/form/field')
      yield I.seeInField('Name', 'OLD_VALUE');
      yield I.seeInField('name', 'OLD_VALUE');
      yield I.seeInField('//input[@id="name"]', 'OLD_VALUE');
      return I.dontSeeInField('//input[@id="name"]', 'NOtVALUE');
    });

    it('should check textarea equals', function*() {
      yield I.amOnPage('/form/textarea')
      yield I.seeInField('Description', 'sunrise');
      yield I.seeInField('textarea', 'sunrise');
      yield I.seeInField('//textarea[@id="description"]', 'sunrise');
      return I.dontSeeInField('//textarea[@id="description"]', 'sunset');
    });

    it('should check checkbox is checked :)', function*() {
      yield I.amOnPage('/info')
      return I.seeCheckboxIsChecked('input[type=checkbox]');
    });

    it('should check checkbox is not checked', function*() {
      yield I.amOnPage('/form/checkbox')
      return I.dontSeeCheckboxIsChecked('#checkin');
    });
  });

  describe('#grabTextFrom, #grabValueFrom, #grabAttributeFrom', () => {
    it('should grab text from page', function*() {
      yield I.amOnPage('/');
      let val = yield I.grabTextFrom('h1');
      assert.equal(val, "Welcome to test app!");
      val = yield I.grabTextFrom('//h1');
      return assert.equal(val, "Welcome to test app!");
    });

    it('should grab value from field', function*() {
      yield I.amOnPage('/form/hidden');
      let val = yield I.grabValueFrom('#action');
      assert.equal(val, "kill_people");
      val = yield I.grabValueFrom("//form/input[@name='action']");
      assert.equal(val, "kill_people");
      yield I.amOnPage('/form/textarea');
      val = yield I.grabValueFrom('#description');
      assert.equal(val, "sunrise");
      yield I.amOnPage('/form/select');
      val = yield I.grabValueFrom('#age');
      return assert.equal(val, "oldfag");
    });

    it('should grab attribute from element', function*() {
      yield I.amOnPage('/search');
      let val = yield I.grabAttributeFrom({css: 'form'}, 'method');
      return assert.equal(val, "get");
    });
  });

  describe('page title : #seeTitle, #dontSeeTitle, #grabTitle', () => {
    it('should check page title', function*() {
      yield I.amOnPage('/');
      yield I.seeInTitle('TestEd Beta 2.0');
      yield I.dontSeeInTitle('Welcome to test app');
      yield I.amOnPage('/info');
      return I.dontSeeInTitle('TestEd Beta 2.0');
    });

    it('should grab page title', function*() {
      yield I.amOnPage('/');
      let val = yield I.grabTitle();
      return assert.equal(val, "TestEd Beta 2.0");
    });
  });

  describe('#attachFile', () => {
    it('should upload file located by CSS', function*() {
      yield I.amOnPage('/form/file');
      yield I.attachFile('#avatar', 'app/avatar.jpg');
      yield I.click('Submit');
      return formContents()['files'].should.have.key('avatar');
    });

    it('should upload file located by label', function*() {
      yield I.amOnPage('/form/file');
      yield I.attachFile('Avatar', 'app/avatar.jpg');
      yield I.click('Submit');
      return formContents()['files'].should.have.key('avatar');
    });
  });

  describe('#saveScreenshot', () => {
    beforeEach(() => {
      global.output_dir = path.join(global.codecept_dir, 'output');
    });

    it('should create a screenshot file in output dir', () => {
      return I.amOnPage('/')
        .then(() => I.saveScreenshot('sw-user.png'))
        .then(() => assert.ok(fileExists(path.join(output_dir, 'sw-user.png')), null, 'file does not exists'));
    });

    it('should create a screenshot file in output dir', () => {
      let test = { title: 'sw should do smth' };
      return I.amOnPage('/')
        .then(() => I._failed(test))
        .then(() => assert.ok(fileExists(path.join(output_dir, 'sw_should_do_smth.failed.png')), null, 'file does not exists'));
    });
  });

  describe('cookies : #setCookie, #clearCookies, #seeCookie', () => {
    it('should do all cookie stuff', () => {
      return I.amOnPage('/')
        .then(() => I.setCookie({name: 'auth', value: '123456'}))
        .then(() => I.seeCookie('auth'))
        .then(() => I.dontSeeCookie('auuth'))
        .then(() => I.grabCookie('auth'))
        .then((cookie) => assert.equal(cookie.value, '123456'))
        .then(() => I.clearCookie('auth'))
        .then(() => I.dontSeeCookie('auth'));
    });
  });
  describe('#waitForText', () => {
    it('should wait for text', () => {
      return I.amOnPage('/dynamic')
        .then(() => I.dontSee('Dynamic text'))
        .then(() => I.waitForText('Dynamic text', 2))
        .then(() => I.see('Dynamic text'));
    });

    it('should wait for text in context', () => {
      return I.amOnPage('/dynamic')
        .then(() => I.dontSee('Dynamic text'))
        .then(() => I.waitForText('Dynamic text', 2, '#text'))
        .then(() => I.see('Dynamic text'));
    });
  });
}