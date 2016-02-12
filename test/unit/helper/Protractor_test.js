'use strict';

let Protractor = require('../../../lib/helper/Protractor');
let site_url = 'http://davertmik.github.io/angular-demo-app';
// let site_url = 'http://127.0.0.1:5000';
let assert = require('assert');
let I, browser;
let path = require('path');
let by = require('protractor').By;
var chai = require('chai');
let should = require('chai').should();
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
let AssertionFailedError = require('../../../lib/assert/error');
let formContents = require('../../../lib/utils').test.submittedData(path.join(__dirname, '../../data/app/db'));
let fileExists = require('../../../lib/utils').fileExists;
let expectError = require('../../../lib/utils').test.expectErrors;

require('co-mocha')(require('mocha'));

function assertFormContains(key, value) {
  return browser.element(by.id('data')).getText().then((text) => {
    return expect(JSON.parse(text)).to.have.deep.property(key, value);
  });
}


describe('Protractor', function() {
  this.timeout(20000);
  
  before(() => {
    global.codecept_dir = path.join(__dirname, '../../data');
    I = new Protractor({url: site_url});
  });
  
  beforeEach(() => {
    return browser = I._before();
  });
  
  afterEach(() => {
    return I._after();
  });  
  
  describe('open page : #amOnPage', () => {
    it('should open main page of configured site', () => {
      I.amOnPage('/');
      return expect(browser.getCurrentUrl()).to.eventually.equal(site_url+'/#/');
    });
    
    it('should open absolute url', () => {
      I.amOnPage(site_url);
      return expect(browser.getCurrentUrl()).to.eventually.equal(site_url+'/#/');
    });
  });
  
  describe('current url : #seeInCurrentUrl, #seeCurrentUrlEquals, ...', () => {
    it('should check for url fragment', function*() {
      yield I.amOnPage(site_url+'/#/info');
      yield I.seeInCurrentUrl('/info');
      return I.dontSeeInCurrentUrl('/result');
    });
  
    it('should check for equality', function*() {
      yield I.amOnPage('/#/info');
      yield I.seeCurrentUrlEquals('/#/info');
      return I.dontSeeCurrentUrlEquals('/#/result');
    });
  });    
  
  describe('see text : #see', () => {
    it('should check text on site', function*() {
      yield I.amOnPage('/');
      yield I.see('Description');
      return I.dontSee('Create Event Today');
    });    
    
    it('should check text inside element', function*() {
      yield I.amOnPage('/#/info');
      yield I.see('About', 'h1');
      yield I.see('Welcome to event app', {css: 'p.jumbotron'});
      return I.see('Back to form', '//div/a');      
    });   
  });
  
  describe('see element : #seeElement, #dontSeeElement', () => {    
    it('should check visible elements on page', function*() {
      yield I.amOnPage('/');
      yield I.seeElement('.btn.btn-primary');
      yield I.seeElement({css: '.btn.btn-primary'});
      return I.dontSeeElement({css: '.btn.btn-secondary'});
    });
  });
  
  describe('#click', () => {
    it('should click by text', function*() {
      yield I.amOnPage('/');
      yield I.dontSeeInCurrentUrl('/info');
      yield I.click('Get more info!');
      return I.seeInCurrentUrl('/info');
    });
    
    it('should click by css', function*() {
      yield I.amOnPage('/');
      yield I.click('.btn-primary');
      return I.seeInCurrentUrl('/result');
    });
    
    it('should click by non-optimal css', function*() {
      yield I.amOnPage('/');
      yield I.click('form a.btn');
      return I.seeInCurrentUrl('/result');
    });    
    
    it('should click by xpath', function*() {
      yield I.amOnPage('/');
      yield I.click('//a[contains(., "more info")]');
      return I.seeInCurrentUrl('/info');
    });
    
    it('should click on context', function*() {
      yield I.amOnPage('/');
      yield I.click('.btn-primary', 'form');
      return I.seeInCurrentUrl('/result');
    });
    
    it('should click link with inner span', function*() {
      yield I.amOnPage('/#/result');
      yield I.click('Go to info');
      return I.seeInCurrentUrl('/info')
    });
    
    it('should click buttons as links', function*() {
      yield I.amOnPage('/');
      yield I.click('Options');
      return I.seeInCurrentUrl('/options')
    });    
  });
  
  describe('#checkOption', () => {
    it('should check option by css', function*() {
      yield I.amOnPage('/#/options');
      yield I.dontSee('Accepted', '#terms');
      yield I.checkOption('.checkboxes .real');        
      return I.see('Accepted', '#terms');
    });
    
    it('should check option by strict locator', function*() {
      yield I.amOnPage('/#/options');
      yield I.checkOption({className: 'real'});
      return I.see('Accepted', '#terms');
    });
    
    it('should check option by name', function*() {
      yield I.amOnPage('/#/options');
      yield I.checkOption('agree');
      return I.see('Accepted', '#terms');
    });
    
    it('should check option by label', function*() {
      yield I.amOnPage('/');
      yield I.checkOption('Designers');
      yield I.click('Submit');
      return assertFormContains('for[0]', 'designers');
    });    
  });
  
  describe('#selectOption', () => {
    it('should select option by css', function*() {
      yield I.amOnPage('/');
      yield I.selectOption('form select', 'Iron Man');
      yield I.click('Submit');
      return assertFormContains('speaker1', 'iron_man');
    });
  
    it('should select option by label', function*(){
      yield I.amOnPage('/')
      yield I.selectOption('Guest Speaker', 'Captain America');
      yield I.click('Submit');
      return assertFormContains('speaker1', 'captain_america');
    });
    
    it('should select option by label and value', function*(){
      yield I.amOnPage('/')
      yield I.selectOption('Guest Speaker', 'string:captain_america');
      yield I.click('Submit');
      return assertFormContains('speaker1', 'captain_america');
    });
    
    it('should select option in grouped select', function*(){
      yield I.amOnPage('/')
      yield I.selectOption('Speaker', 'Captain America');
      yield I.click('Submit');
      return assertFormContains('speaker2', 'captain_america');
    });    
    
  });
  
  describe('#fillField, #appendField', () => {
    it('should fill input by label', function*() {
      yield I.amOnPage('/');
      yield I.fillField('Name', 'Jon Doe');
      yield I.click('Submit');
      return assertFormContains('name', 'Jon Doe');      
    });
    
    it('should fill textarea by label', function*() {
      yield I.amOnPage('/');
      yield I.fillField('Description', 'Just the best event');
      yield I.click('Submit');
      return assertFormContains('description', 'Just the best event');      
    });    
    
    it('should fill field by placeholder', function*() {
      yield I.amOnPage('/');
      yield I.fillField('Please enter a name', 'Jon Doe');
      yield I.click('Submit');
      return assertFormContains('name', 'Jon Doe');    
    });
    
    it('should fill field by css ', function*() {
      yield I.amOnPage('/#/options');
      yield I.fillField('input.code', '0123456');
      return I.see('Code: 0123456');
    });
    
    it('should fill field by model ', function*() {
      yield I.amOnPage('/#/options');
      yield I.fillField({model: 'license'}, 'AAABBB');
      return I.see('AAABBB', '.results');
    });
    
    it('should fill field by name ', function*() {
      yield I.amOnPage('/#/options');
      yield I.fillField('mylicense', 'AAABBB');
      return I.see('AAABBB', '.results');
    });    
    
    it('should fill textarea by name ', function*() {
      yield I.amOnPage('/#/options');
      yield I.fillField('sshkey', 'hellossh');
      return I.see('hellossh', '.results');
    });    
    
    it('should fill textarea by css ', function*() {
      yield I.amOnPage('/#/options');
      yield I.fillField('.inputs textarea', 'hellossh');
      return I.see('SSH Public Key: hellossh', '.results');
    });        
    
    it('should fill textarea by model', function*() {
      yield I.amOnPage('/#/options');
      yield I.fillField({model: 'ssh'}, 'hellossh');
      return I.see('SSH Public Key: hellossh', '.results');
    });
    
    it('should append value to field', function*() {
      yield I.amOnPage('/#/options');
      yield I.appendField({model: 'ssh'}, 'hellossh');
      return I.see('SSH Public Key: PUBLIC-SSH-KEYhellossh', '.results');      
    });    
  });

  describe('check fields: #seeInField, #seeCheckboxIsChecked, ...', () => {
    it('should check for empty field', function*() {
      yield I.amOnPage('/#/options');
      return I.seeInField('code', '');      
    });
    
    it('should throw error if field is not empty', function*() {
      yield I.amOnPage('/#/options');
      return I.seeInField('#ssh', 'something')
        .then(expectError)
        .catch((e) => {
          e.should.be.instanceOf(AssertionFailedError);
          e.inspect().should.be.equal('expected field by #ssh to include something');
        });
    });
    
    it('should check field equals', function*() {
      yield I.amOnPage('/#/options');
      yield I.seeInField({model: 'ssh'}, 'PUBLIC-SSH-KEY');
      yield I.seeInField('#ssh', 'PUBLIC-SSH-KEY');
      yield I.seeInField('sshkey', 'PUBLIC-SSH-KEY');
      return yield I.dontSeeInField('sshkey', 'PUBLIC-SSL-KEY');      
    });
    
    it('should check values in select', function*() {
      yield I.amOnPage('/#/options');
      return I.seeInField('auth', 'SSH');      
    });
    
    it('should check checkbox is checked :)', function*() {
      yield I.amOnPage('/#/options');
      yield I.seeCheckboxIsChecked('notagree');
      yield I.dontSeeCheckboxIsChecked({model: 'agree'});
      return I.dontSeeCheckboxIsChecked('#agreenot');
    });    
    
  });
  
  describe('#grabTextFrom, #grabValueFrom, #grabAttribute', () => {
    it('should grab text from page', function*() {
      yield I.amOnPage('/#/info');
      let val = yield I.grabTextFrom('p.jumbotron');
      return expect(val).to.equal('Welcome to event app');
    });
    
    it('should grab value from field', function*() {
      yield I.amOnPage('/#/options');
      let val = yield I.grabValueFrom('#ssh');
      return expect(val).to.equal('PUBLIC-SSH-KEY');      
    });
    
    it('should grab value from select', function*() {
      yield I.amOnPage('/#/options');
      let val = yield I.grabValueFrom('auth');
      return expect(val).to.equal('ssh');      
    });
    
    it('should grab attribute from element', function*() {
      yield I.amOnPage('/#/info');
      let val = yield I.grabAttribute('a.btn', 'ng-href');
      return expect(val).to.equal('#/');            
    });
  });  
  
  describe('page title : #seeTitle, #dontSeeTitle, #grabTitle', () => {
    it('should check page title', function*() {
      yield I.amOnPage('/');
      return I.seeInTitle('Event App');
    });
    
    it('should grab page title', function*() {
      yield I.amOnPage('/');      
      return expect(I.grabTitle()).to.eventually.equal('Event App');
    });    
  });
  
  describe('#attachFile', () => {
    beforeEach(() => {
      I.amOutsideAngularApp(); // switch off angular mode
      return I.amOnPage('http://localhost:8000/form/file');      
    });
    
    it('should upload file located by CSS', function*() {
      yield I.attachFile('#avatar', 'app/avatar.jpg');
      yield I.click('Submit');
      return formContents()['files'].should.have.key('avatar');      
    });
    
    it('should upload file located by label', function*() {
      yield I.attachFile('Avatar', 'app/avatar.jpg');
      yield I.click('Submit');
      return formContents()['files'].should.have.key('avatar');      
    });
  });
  
  describe('#saveScreenshot', () => {
    beforeEach(() => {
      global.output_dir = path.join(global.codecept_dir, 'output');
    });

    it('should create a screenshot file in output dir', function*() {
      yield I.amOnPage('/');
      yield I.saveScreenshot('protractor_user.png');
      return assert.ok(fileExists(path.join(output_dir, 'protractor_user.png')), null, 'file does not exists');
    });

    it('should create a screenshot on fail', function*() {
      let test = { name: 'protractor should do smth' };
      yield I.amOnPage('/')
      yield I._failed(test);
      return assert.ok(fileExists(path.join(output_dir, 'protractor_should_do_smth.failed.png')), null, 'file does not exists');
    });
  });
  
  describe('cookies : #setCookie, #clearCookies, #seeCookie', () => {
    it('should do all cookie stuff', function*() {
      yield I.amOnPage('/')
      yield I.setCookie({name: 'auth', value: '123456'});
      yield I.seeCookie('auth');
      yield I.dontSeeCookie('auuth');
      yield I.grabCookie('auth').then((cookie) => assert.equal(cookie.value, '123456'));
      yield I.clearCookie('auth');
      yield I.dontSeeCookie('auth');
    });
  });  
  
  describe('#seeInSource', () => {
    it('should check for text to be in HTML source', function*() {
      yield I.amOnPage('/')
      yield I.seeInSource('<meta charset="utf-8"');
      return I.dontSeeInSource('<article');
    });
  });  
  
  describe('window size : #resizeWindow', () => {
    it('should change the active window size', function*() {
      yield I.amOnPage('/')
      yield I.resizeWindow(640, 480);
      let size = yield I.browser.manage().window().getSize();
      assert.equal(size.width, 640);
      assert.equal(size.height, 480);
    });
  });  
  
  describe('#waitForText', () => {
    beforeEach(() => {
      return I.amOnPage('/#/info');   
    });
    
    it('should wait for text', function*() {
      yield I.dontSee('Boom!');
      yield I.waitForText('Boom!', 2);
      return I.see('Boom!');
    });

    it('should wait for text in context', function*() {
      yield I.dontSee('Boom!');
      yield I.waitForText('Boom!', 2, '#hello');
      return I.see('Boom!');
    });

    it('should return error if not present', function*() {
      return I.waitForText('Nothing here', 0, '#hello')
        .then(expectError)
        .thenCatch((e) => {
          e.message.should.include('Wait timed out');
        });
    });

    it('should return error if waiting is too small', function*() {
      return I.waitForText('Boom!', 0.5)
        .then(expectError)
        .thenCatch((e) => {
          e.message.should.include('Wait timed out');
        });
    });
  });
});