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

  describe('#replaceValue', () => {
    let target;

    it('returns updated object', () => {
      target = {
        timeout: 1,
        helpers: {
          something: 2,
        },
      };

      utils.replaceValue(target.helpers, 'something', 1234).should.eql({ something: 1234 });
      target.should.eql({
        timeout: 1,
        helpers: {
          something: 1234,
        },
      });
    });

    it('do not replace unexisting value', () => {
      target = {
        timeout: 1,
        helpers: {
          something: 2,
        },
      };

      utils.replaceValue(target, 'unexisting', 1234);
      target.should.eql({
        timeout: 1,
        helpers: {
          something: 2,
        },
      });
    });

    it('replace simple value', () => {
      target = {
        timeout: 1,
        helpers: {
          something: 2,
        },
      };

      utils.replaceValue(target, 'timeout', 1234);
      target.should.eql({
        timeout: 1234,
        helpers: {
          something: 2,
        },
      });
    });

    it('replace simple falsy value', () => {
      target = {
        zeroValue: {
          timeout: 0,
        },
        falseValue: {
          timeout: false,
        },
        undefinedValue: {
          timeout: undefined,
        },
        emptyStringValue: {
          timeout: '',
        },
        nullValue: {
          timeout: null,
        },
      };

      utils.replaceValue(target, 'timeout', 1234);
      target.should.eql({
        zeroValue: {
          timeout: 1234,
        },
        falseValue: {
          timeout: 1234,
        },
        undefinedValue: {
          timeout: 1234,
        },
        emptyStringValue: {
          timeout: 1234,
        },
        nullValue: {
          timeout: 1234,
        },
      });
    });

    it('replace value in array of objects', () => {
      target = {
        timeout: 1,
        something: [{
          a: 1,
          b: 2,
        }, {
          a: 3,
        },
        123,
        0,
        [{ a: 1 }, 123]],
      };

      utils.replaceValue(target, 'a', 1234);
      target.should.eql({
        timeout: 1,
        something: [{
          a: 1234,
          b: 2,
        }, {
          a: 1234,
        },
        123,
        0,
        [{ a: 1234 }, 123]],
      });
    });

    it('replace simple value deep in object', () => {
      target = {
        timeout: 1,
        helpers: {
          something: {
            otherthing: 2,
          },
        },
      };

      utils.replaceValue(target, 'otherthing', 1234);
      target.should.eql({
        timeout: 1,
        helpers: {
          something: {
            otherthing: 1234,
          },
        },
      });
    });

    it('replace object value', () => {
      target = {
        timeout: 1,
        helpers: {
          WebDriver: {
            timeouts: 0,
            url: 'someurl',
          },
          someHelper: {
            timeouts: 3,
          },
        },
      };

      utils.replaceValue(target.helpers, 'WebDriver', { timeouts: 1234 });
      target.should.eql({
        timeout: 1,
        helpers: {
          WebDriver: {
            timeouts: 1234,
            // url is not described in new object
          },
          someHelper: {
            timeouts: 3,
          },
        },
      });
    });
  });
});
