'use strict';
let utils = require('../../lib/utils');
let assert = require('assert');
let should = require('chai').should();

describe('utils', () => {
  
  describe('#fileExists', () => {
    it('exists', () => assert(utils.fileExists(__filename)));
    it('not exists', () => assert(!utils.fileExists('not_utils.js'))); 
  });
  
  describe('#getParamNames', () => {
    it('fn#1', () => utils.getParamNames(function(a,b) {}).should.eql(['a', 'b']));    
    it('fn#2', () => utils.getParamNames((I, userPage) => { }).should.eql(['I', 'userPage']));    
  });
  
  describe('#methodsOfObject', () => {
    it('should get methods', () => {
      utils.methodsOfObject({
        a: 1,
        hello: () => {},
        world: () => {},
      }).should.eql(['hello', 'world']);      
    });
  });
  
  describe('#ucfirst', () => {
    it('should capitalize first letter', () => {
      utils.ucfirst('hello').should.equal('Hello');
    });
  });
  
  describe('#xpathLocator', () => {
    it('combines xpaths', () => {
      utils.xpathLocator.combine(['//a', '//button'])
        .should.eql('//a | //button');
    });
    
    it('converts string to xpath literal', () => {
      utils.xpathLocator.literal("can't find thing")
        .should.eql(`concat('can',"'",'t find thing')`);
    });
  });
  
  
  
});