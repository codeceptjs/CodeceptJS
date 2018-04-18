const parser = require('../../lib/parser');
const assert = require('assert');
const chai = require('chai');

const expect = chai.expect;

class Obj {
  method1(locator, sec) {}
  method2(locator, value, sec) {}
  method3(locator, context) {}
  async method4(locator, context) {}
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

  describe('#toTypeDef', () => {
    it('should transform function to TS types', () => {
      const res = parser.toTypeDef(obj.method1);
      expect(res).to.include('    method1(locator: ILocator, sec: number) : void');
      expect(res).to.include('    method1(locator: string, sec: number) : void');
    });

    it('should transform function to TS types', () => {
      const res = parser.toTypeDef(obj.method2);
      expect(res).to.include('method2(locator: ILocator, value: string, sec: number) : void');
      expect(res).to.include('method2(locator: string, value: string, sec: number) : void');
    });

    it('should transform function to TS types', () => {
      const res = parser.toTypeDef(obj.method3);
      expect(res).to.include('method3(locator: ILocator, context: ILocator) : void');
      expect(res).to.include('method3(locator: ILocator, context: string) : void');
      expect(res).to.include('method3(locator: string, context: ILocator) : void');
      expect(res).to.include('method3(locator: string, context: string) : void');
    });

    it('should transform function to TS types', () => {
      const res = parser.toTypeDef(obj.method4);
      expect(res).to.include('method4(locator: ILocator, context: ILocator) : void');
      expect(res).to.include('method4(locator: ILocator, context: string) : void');
      expect(res).to.include('method4(locator: string, context: ILocator) : void');
      expect(res).to.include('method4(locator: string, context: string) : void');
    });
  });
});
