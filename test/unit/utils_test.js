const expect = require('expect');
const os = require('os');
const path = require('path');
const sinon = require('sinon');

const utils = require('../../lib/utils');

describe('utils', () => {
  describe('#fileExists', () => {
    it('exists', () => expect(utils.fileExists(__filename)).toBeTruthy);
    it('not exists', () => expect(utils.fileExists('not_utils.js')).toBeFalsy());
    it('not exists if file used as directory', () => expect(utils.fileExists(`${__filename}/not_utils.js`)).toBeFalsy());
  });
  /* eslint-disable no-unused-vars */
  describe('#getParamNames', () => {
    it('fn#1', () => expect(utils.getParamNames((a, b) => { })).toEqual(['a', 'b']));
    it('fn#2', () => expect(utils.getParamNames((I, userPage) => { })).toEqual(['I', 'userPage']));
    it('should handle single-param arrow functions with omitted parens', () => expect(utils.getParamNames((I) => { })).toEqual(['I']));
    it('should handle trailing comma', () => expect(utils.getParamNames((
      I,
      trailing,
      comma,
    ) => { })).toEqual(['I', 'trailing', 'comma']));
  });
  /* eslint-enable no-unused-vars */

  describe('#methodsOfObject', () => {
    it('should get methods', () => {
      expect(utils.methodsOfObject({
        a: 1,
        hello: () => { },
        world: () => { },
      })).toEqual(['hello', 'world']);
    });
  });

  describe('#ucfirst', () => {
    it('should capitalize first letter', () => {
      expect(utils.ucfirst('hello')).toEqual('Hello');
    });
  });

  describe('#beautify', () => {
    it('should beautify JS code', () => {
      expect(utils
        .beautify('module.exports = function(a, b) { a++; b = a; if (a == b) { return 2 }};')).toEqual(`module.exports = function(a, b) {
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
      expect(utils.xpathLocator.combine(['//a', '//button'])).toEqual('//a | //button');
    });

    it('converts string to xpath literal', () => {
      expect(utils.xpathLocator.literal("can't find thing")).toEqual('concat(\'can\',"\'",\'t find thing\')');
    });
  });

  describe('#replaceValueDeep', () => {
    let target;

    it('returns updated object', () => {
      target = {
        timeout: 1,
        helpers: {
          something: 2,
        },
      };

      expect(utils.replaceValueDeep(target.helpers, 'something', 1234)).toEqual({ something: 1234 });
      expect(target).toEqual({
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

      utils.replaceValueDeep(target, 'unexisting', 1234);
      expect(target).toEqual({
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

      utils.replaceValueDeep(target, 'timeout', 1234);
      expect(target).toEqual({
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

      utils.replaceValueDeep(target, 'timeout', 1234);
      expect(target).toEqual({
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

      utils.replaceValueDeep(target, 'a', 1234);
      expect(target).toEqual({
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

      utils.replaceValueDeep(target, 'otherthing', 1234);
      expect(target).toEqual({
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

      utils.replaceValueDeep(target.helpers, 'WebDriver', { timeouts: 1234 });
      expect(target).toEqual({
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

  describe('#getNormalizedKeyAttributeValue', () => {
    it('should normalize key (alias) to key attribute value', () => {
      expect(utils.getNormalizedKeyAttributeValue('Arrow down')).toEqual('ArrowDown');
      expect(utils.getNormalizedKeyAttributeValue('RIGHT_ARROW')).toEqual('ArrowRight');
      expect(utils.getNormalizedKeyAttributeValue('leftarrow')).toEqual('ArrowLeft');
      expect(utils.getNormalizedKeyAttributeValue('Up arrow')).toEqual('ArrowUp');

      expect(utils.getNormalizedKeyAttributeValue('Left Alt')).toEqual('AltLeft');
      expect(utils.getNormalizedKeyAttributeValue('RIGHT_ALT')).toEqual('AltRight');
      expect(utils.getNormalizedKeyAttributeValue('alt')).toEqual('Alt');

      expect(utils.getNormalizedKeyAttributeValue('oPTION left')).toEqual('AltLeft');
      expect(utils.getNormalizedKeyAttributeValue('ALTGR')).toEqual('AltGraph');
      expect(utils.getNormalizedKeyAttributeValue('alt graph')).toEqual('AltGraph');

      expect(utils.getNormalizedKeyAttributeValue('Control Left')).toEqual('ControlLeft');
      expect(utils.getNormalizedKeyAttributeValue('RIGHT_CTRL')).toEqual('ControlRight');
      expect(utils.getNormalizedKeyAttributeValue('Ctrl')).toEqual('Control');

      expect(utils.getNormalizedKeyAttributeValue('Cmd')).toEqual('Meta');
      expect(utils.getNormalizedKeyAttributeValue('LeftCommand')).toEqual('MetaLeft');
      expect(utils.getNormalizedKeyAttributeValue('os right')).toEqual('MetaRight');
      expect(utils.getNormalizedKeyAttributeValue('SUPER')).toEqual('Meta');

      expect(utils.getNormalizedKeyAttributeValue('NumpadComma')).toEqual('Comma');
      expect(utils.getNormalizedKeyAttributeValue('Separator')).toEqual('Comma');

      expect(utils.getNormalizedKeyAttributeValue('Add')).toEqual('NumpadAdd');
      expect(utils.getNormalizedKeyAttributeValue('Decimal')).toEqual('NumpadDecimal');
      expect(utils.getNormalizedKeyAttributeValue('Divide')).toEqual('NumpadDivide');
      expect(utils.getNormalizedKeyAttributeValue('Multiply')).toEqual('NumpadMultiply');
      expect(utils.getNormalizedKeyAttributeValue('Subtract')).toEqual('NumpadSubtract');
    });

    it('should normalize modifier key based on operating system', () => {
      sinon.stub(os, 'platform').callsFake(() => { return 'notdarwin'; });
      expect(utils.getNormalizedKeyAttributeValue('CmdOrCtrl')).toEqual('Control');
      expect(utils.getNormalizedKeyAttributeValue('COMMANDORCONTROL')).toEqual('Control');
      expect(utils.getNormalizedKeyAttributeValue('ControlOrCommand')).toEqual('Control');
      expect(utils.getNormalizedKeyAttributeValue('left ctrl or command')).toEqual('ControlLeft');
      os.platform.restore();

      sinon.stub(os, 'platform').callsFake(() => { return 'darwin'; });
      expect(utils.getNormalizedKeyAttributeValue('CtrlOrCmd')).toEqual('Meta');
      expect(utils.getNormalizedKeyAttributeValue('CONTROLORCOMMAND')).toEqual('Meta');
      expect(utils.getNormalizedKeyAttributeValue('CommandOrControl')).toEqual('Meta');
      expect(utils.getNormalizedKeyAttributeValue('right command or ctrl')).toEqual('MetaRight');
      os.platform.restore();
    });
  });

  describe('#screenshotOutputFolder', () => {
    let _oldGlobalOutputDir;
    let _oldGlobalCodeceptDir;

    before(() => {
      _oldGlobalOutputDir = global.output_dir;
      _oldGlobalCodeceptDir = global.codecept_dir;

      global.output_dir = '/Users/someuser/workbase/project1/test_output';
      global.codecept_dir = '/Users/someuser/workbase/project1/tests/e2e';
    });

    after(() => {
      global.output_dir = _oldGlobalOutputDir;
      global.codecept_dir = _oldGlobalCodeceptDir;
    });

    it('returns the joined filename for filename only', () => {
      const _path = utils.screenshotOutputFolder('screenshot1.failed.png');
      expect(_path).toEqual(
        '/Users/someuser/workbase/project1/test_output/screenshot1.failed.png'.replace(
          /\//g,
          path.sep,
        ),
      );
    });

    it('returns the given filename for absolute one', () => {
      const _path = utils.screenshotOutputFolder(
        '/Users/someuser/workbase/project1/test_output/screenshot1.failed.png'.replace(
          /\//g,
          path.sep,
        ),
      );
      if (os.platform() === 'win32') {
        expect(_path).toEqual(
          path.resolve(
            global.codecept_dir,
            '/Users/someuser/workbase/project1/test_output/screenshot1.failed.png',
          ),
        );
      } else {
        expect(_path).toEqual(
          '/Users/someuser/workbase/project1/test_output/screenshot1.failed.png',
        );
      }
    });
  });

  describe('#requireWithFallback', () => {
    it('returns the fallback package', () => {
      expect(utils.requireWithFallback('unexisting-package', 'playwright')).toEqual(require('playwright'));
    });

    it('returns provide default require not found message', () => {
      expect(() => utils.requireWithFallback('unexisting-package', 'unexisting-package2'))
        .toThrow(Error, 'Cannot find modules unexisting-package,unexisting-package2');
    });
  });
});
