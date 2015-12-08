'use strict';

let WebDriverIO = require('../../../lib/helper/WebDriverIO'); 
let should = require('chai').should();
let wd;
let site_url = 'http://127.0.0.1:8000';
let assert = require('assert');
let path = require('path');
let fs = require('fs');
const dataFile = path.join(__dirname, '../../data/app/db');


function formContents(key) {
  let data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  if (key) {
    return data['form'][key];
  }
  return data;
}

describe('WebDriverIO', function() {
  this.timeout(10000);
  
  before(() => {
    wd = new WebDriverIO({
      url: site_url,
      browser: 'firefox'
    });    
  });
  
  beforeEach(() => {
    fs.unlinkSync(dataFile);
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
    
    it('should check text inside element', () => {
      return wd.amOnPage('/')
        .then(() => wd.see('Welcome to test app!', 'h1'))
        .then(() => wd.amOnPage('/info'))
        .then(() => wd.see('valuable', { css: 'p'}))
        .then(() => wd.see('valuable', '//body/p'))
        .then(() => wd.dontSee('valuable', 'h1'));
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
        .then(() => wd.click('//a[@id=link]'))
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
  
});