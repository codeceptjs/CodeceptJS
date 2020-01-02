const chai = require('chai');

const parser = require('../../lib/parser');

const expect = chai.expect;

class Obj {
  method1(locator, sec) {}

  method2(locator, value, sec) {}

  method3(locator, context) {}

  async method4(locator, context) {
    return false;
  }
}

describe('parser', () => {
  const obj = new Obj();

  describe('#getParamsToString', () => {
    it('should get params for normal function', () => {
      expect(parser.getParamsToString(obj.method1)).to.eql('locator, sec');
    });

    it('should get params for async function', () => {
      expect(parser.getParamsToString(obj.method4)).to.eql('locator, context');
    });
  });
});
