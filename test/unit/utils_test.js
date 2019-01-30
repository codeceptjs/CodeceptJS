const utils = require('../../lib/utils');
const assert = require('assert');

describe('utils', () => {
  describe('#fileExists', () => {
    it('exists', () => assert(utils.fileExists(__filename)));
    it('not exists', () => assert(!utils.fileExists('not_utils.js')));
  });

  describe('#getParamNames', () => {
    it('fn#1', () => utils.getParamNames((a, b) => {}).should.eql(['a', 'b']));
    it('fn#2', () => utils.getParamNames((I, userPage) => { }).should.eql(['I', 'userPage']));
    it('should handle single-param arrow functions with omitted parens', () => utils.getParamNames((I) => {}).should.eql(['I']));
    it('should handle trailing comma', () => utils.getParamNames((
      I,
      trailing,
      comma,
    ) => {}).should.eql(['I', 'trailing', 'comma']));
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

  describe('#beautify', () => {
    it('should beautify JS code', () => {
      utils
        .beautify('module.exports = function(a, b) { a++; b = a; if (a == b) { return 2 }};')
        .should.eql(`module.exports = function(a, b) {
  a++;
  b = a;
  if (a == b) {
    return 2
  }
};`);
    });
  });


  describe('#xpathLocator', () => {
    it('combines xpaths', () => {
      utils.xpathLocator.combine(['//a', '//button'])
        .should.eql('//a | //button');
    });

    it('converts string to xpath literal', () => {
      utils.xpathLocator.literal("can't find thing")
        .should.eql('concat(\'can\',"\'",\'t find thing\')');
    });
  });
});
