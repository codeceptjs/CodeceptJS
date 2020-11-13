const { expect } = require('chai');
const os = require('os');
const path = require('path');
const sinon = require('sinon');

const utils = require('../../lib/utils');

describe('utils', () => {
  describe('#fileExists', () => {
    it('exists', () => expect(utils.fileExists(__filename)));
    it('not exists', () => expect(!utils.fileExists('not_utils.js')));
  });
  /* eslint-disable no-unused-vars */
  describe('#getParamNames', () => {
    it('fn#1', () => expect(utils.getParamNames((a, b) => { })).eql(['a', 'b']));
    it('fn#2', () => expect(utils.getParamNames((I, userPage) => { })).eql(['I', 'userPage']));
    it('should handle single-param arrow functions with omitted parens', () => expect(utils.getParamNames((I) => { })).eql(['I']));
    it('should handle trailing comma', () => expect(utils.getParamNames((
      I,
      trailing,
      comma,
    ) => { })).eql(['I', 'trailing', 'comma']));
  });
  /* eslint-enable no-unused-vars */

  describe('#methodsOfObject', () => {
    it('should get methods', () => {
      expect(utils.methodsOfObject({
        a: 1,
        hello: () => { },
        world: () => { },
      })).eql(['hello', 'world']);
    });
  });

  describe('#ucfirst', () => {
    it('should capitalize first letter', () => {
      expect(utils.ucfirst('hello')).equal('Hello');
    });
  });

  describe('#beautify', () => {
    it('should beautify JS code', () => {
      expect(utils
        .beautify('module.exports = function(a, b) { a++; b = a; if (a == b) { return 2 }};')
      ).eql(`module.exports = function(a, b) {
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
      expect(utils.xpathLocator.combine(['//a', '//button'])
      ).eql('//a | //button');
    });

    it('converts string to xpath literal', () => {
      expect(utils.xpathLocator.literal("can't find thing")
      ).eql('concat(\'can\',"\'",\'t find thing\')');
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

      expect(utils.replaceValueDeep(target.helpers, 'something', 1234)).eql({ something: 1234 });
      expect(target).eql({
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
      expect(target).eql({
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
      expect(target).eql({
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
      expect(target).eql({
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
      expect(target).eql({
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
      expect(target).eql({
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
      expect(target).eql({
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
      expect(utils.getNormalizedKeyAttributeValue('Arrow down')).equal('ArrowDown');
      expect(utils.getNormalizedKeyAttributeValue('RIGHT_ARROW')).equal('ArrowRight');
      expect(utils.getNormalizedKeyAttributeValue('leftarrow')).equal('ArrowLeft');
      expect(utils.getNormalizedKeyAttributeValue('Up arrow')).equal('ArrowUp');

      expect(utils.getNormalizedKeyAttributeValue('Left Alt')).equal('AltLeft');
      expect(utils.getNormalizedKeyAttributeValue('RIGHT_ALT')).equal('AltRight');
      expect(utils.getNormalizedKeyAttributeValue('alt')).equal('Alt');

      expect(utils.getNormalizedKeyAttributeValue('oPTION left')).equal('AltLeft');
      expect(utils.getNormalizedKeyAttributeValue('ALTGR')).equal('AltGraph');
      expect(utils.getNormalizedKeyAttributeValue('alt graph')).equal('AltGraph');

      expect(utils.getNormalizedKeyAttributeValue('Control Left')).equal('ControlLeft');
      expect(utils.getNormalizedKeyAttributeValue('RIGHT_CTRL')).equal('ControlRight');
      expect(utils.getNormalizedKeyAttributeValue('Ctrl')).equal('Control');

      expect(utils.getNormalizedKeyAttributeValue('Cmd')).equal('Meta');
      expect(utils.getNormalizedKeyAttributeValue('LeftCommand')).equal('MetaLeft');
      expect(utils.getNormalizedKeyAttributeValue('os right')).equal('MetaRight');
      expect(utils.getNormalizedKeyAttributeValue('SUPER')).equal('Meta');

      expect(utils.getNormalizedKeyAttributeValue('NumpadComma')).equal('Comma');
      expect(utils.getNormalizedKeyAttributeValue('Separator')).equal('Comma');

      expect(utils.getNormalizedKeyAttributeValue('Add')).equal('NumpadAdd');
      expect(utils.getNormalizedKeyAttributeValue('Decimal')).equal('NumpadDecimal');
      expect(utils.getNormalizedKeyAttributeValue('Divide')).equal('NumpadDivide');
      expect(utils.getNormalizedKeyAttributeValue('Multiply')).equal('NumpadMultiply');
      expect(utils.getNormalizedKeyAttributeValue('Subtract')).equal('NumpadSubtract');
    });

    it('should normalize modifier key based on operating system', () => {
      sinon.stub(os, 'platform').returns('notdarwin');
      expect(utils.getNormalizedKeyAttributeValue('CmdOrCtrl')).equal('Control');
      expect(utils.getNormalizedKeyAttributeValue('COMMANDORCONTROL')).equal('Control');
      expect(utils.getNormalizedKeyAttributeValue('ControlOrCommand')).equal('Control');
      expect(utils.getNormalizedKeyAttributeValue('left ctrl or command')).equal('ControlLeft');
      os.platform.restore();

      sinon.stub(os, 'platform').returns('darwin');
      expect(utils.getNormalizedKeyAttributeValue('CtrlOrCmd')).equal('Meta');
      expect(utils.getNormalizedKeyAttributeValue('CONTROLORCOMMAND')).equal('Meta');
      expect(utils.getNormalizedKeyAttributeValue('CommandOrControl')).equal('Meta');
      expect(utils.getNormalizedKeyAttributeValue('right command or ctrl')).equal('MetaRight');
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
      expect(_path).eql(
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
        expect(_path).eql(
          path.resolve(
            global.codecept_dir,
            '/Users/someuser/workbase/project1/test_output/screenshot1.failed.png',
          ),
        );
      } else {
        expect(_path).eql(
          '/Users/someuser/workbase/project1/test_output/screenshot1.failed.png',
        );
      }
    });
  });
});
