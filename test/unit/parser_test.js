const chai = require('chai');

const parser = require('../../lib/parser');

const expect = chai.expect;

/* eslint-disable no-unused-vars */
class Obj {
  method1(locator, sec) {}

  method2(locator, value, sec) {}

  method3(locator, context) {}

  async method4(locator, context) {
    return false;
  }

  method5({ locator, sec }) {}
}
const fixturesDestructuredArgs = [
  'function namedFn({locator, sec}) {}',
  'function * namedFn({locator, sec}) {}',
  '({locator, sec}) => {}',
  '({locator, sec}) => {}',
];

describe('parser', () => {
  const obj = new Obj();

  describe('#getParamsToString', () => {
    it('should get params for normal function', () => {
      expect(parser.getParamsToString(obj.method1)).to.eql('locator, sec');
    });

    it('should get params for async function', () => {
      expect(parser.getParamsToString(obj.method4)).to.eql('locator, context');
    });
    fixturesDestructuredArgs.forEach(arg => {
      it(`should get params for anonymous function with destructured args | ${arg}`, () => {
        expect(parser.getParams(arg)).to.eql(['locator', 'sec']);
      });
    });

    it('should get params for anonymous function with destructured args', () => {
      expect(parser.getParams(({ locator, sec }, { first, second }) => {})).to.eql(['locator', 'sec', 'first', 'second']);
    });

    it('should get params for class method with destructured args', () => {
      expect(parser.getParams(obj.method5)).to.eql(['locator', 'sec']);
    });
  });
});
