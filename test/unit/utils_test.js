const assert = require('assert');
const os = require('os');
const path = require('path');
const sinon = require('sinon');

const utils = require('../../lib/utils');

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

  describe('#replaceValueDeep', () => {
    let target;

    it('returns updated object', () => {
      target = {
        timeout: 1,
        helpers: {
          something: 2,
        },
      };

      utils.replaceValueDeep(target.helpers, 'something', 1234).should.eql({ something: 1234 });
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

      utils.replaceValueDeep(target, 'unexisting', 1234);
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

      utils.replaceValueDeep(target, 'timeout', 1234);
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

      utils.replaceValueDeep(target, 'timeout', 1234);
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

      utils.replaceValueDeep(target, 'a', 1234);
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

      utils.replaceValueDeep(target, 'otherthing', 1234);
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

      utils.replaceValueDeep(target.helpers, 'WebDriver', { timeouts: 1234 });
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

  describe('#getNormalizedKeyAttributeValue', () => {
    it('should normalize key (alias) to key attribute value', () => {
      utils.getNormalizedKeyAttributeValue('Arrow down').should.equal('ArrowDown');
      utils.getNormalizedKeyAttributeValue('RIGHT_ARROW').should.equal('ArrowRight');
      utils.getNormalizedKeyAttributeValue('leftarrow').should.equal('ArrowLeft');
      utils.getNormalizedKeyAttributeValue('Up arrow').should.equal('ArrowUp');

      utils.getNormalizedKeyAttributeValue('Left Alt').should.equal('AltLeft');
      utils.getNormalizedKeyAttributeValue('RIGHT_ALT').should.equal('AltRight');
      utils.getNormalizedKeyAttributeValue('alt').should.equal('Alt');

      utils.getNormalizedKeyAttributeValue('oPTION left').should.equal('AltLeft');
      utils.getNormalizedKeyAttributeValue('ALTGR').should.equal('AltGraph');
      utils.getNormalizedKeyAttributeValue('alt graph').should.equal('AltGraph');

      utils.getNormalizedKeyAttributeValue('Control Left').should.equal('ControlLeft');
      utils.getNormalizedKeyAttributeValue('RIGHT_CTRL').should.equal('ControlRight');
      utils.getNormalizedKeyAttributeValue('Ctrl').should.equal('Control');

      utils.getNormalizedKeyAttributeValue('Cmd').should.equal('Meta');
      utils.getNormalizedKeyAttributeValue('LeftCommand').should.equal('MetaLeft');
      utils.getNormalizedKeyAttributeValue('os right').should.equal('MetaRight');
      utils.getNormalizedKeyAttributeValue('SUPER').should.equal('Meta');

      utils.getNormalizedKeyAttributeValue('NumpadComma').should.equal('Comma');
      utils.getNormalizedKeyAttributeValue('Separator').should.equal('Comma');

      utils.getNormalizedKeyAttributeValue('Add').should.equal('NumpadAdd');
      utils.getNormalizedKeyAttributeValue('Decimal').should.equal('NumpadDecimal');
      utils.getNormalizedKeyAttributeValue('Divide').should.equal('NumpadDivide');
      utils.getNormalizedKeyAttributeValue('Multiply').should.equal('NumpadMultiply');
      utils.getNormalizedKeyAttributeValue('Subtract').should.equal('NumpadSubtract');
    });

    it('should normalize modifier key based on operating system', () => {
      sinon.stub(os, 'platform', () => { return 'notdarwin'; });
      utils.getNormalizedKeyAttributeValue('CmdOrCtrl').should.equal('Control');
      utils.getNormalizedKeyAttributeValue('COMMANDORCONTROL').should.equal('Control');
      utils.getNormalizedKeyAttributeValue('ControlOrCommand').should.equal('Control');
      utils.getNormalizedKeyAttributeValue('left ctrl or command').should.equal('ControlLeft');
      os.platform.restore();

      sinon.stub(os, 'platform', () => { return 'darwin'; });
      utils.getNormalizedKeyAttributeValue('CtrlOrCmd').should.equal('Meta');
      utils.getNormalizedKeyAttributeValue('CONTROLORCOMMAND').should.equal('Meta');
      utils.getNormalizedKeyAttributeValue('CommandOrControl').should.equal('Meta');
      utils.getNormalizedKeyAttributeValue('right command or ctrl').should.equal('MetaRight');
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
      _path.should.eql(
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
        _path.should.eql(
          path.resolve(
            global.codecept_dir,
            '/Users/someuser/workbase/project1/test_output/screenshot1.failed.png',
          ),
        );
      } else {
        _path.should.eql(
          '/Users/someuser/workbase/project1/test_output/screenshot1.failed.png',
        );
      }
    });
  });
});
