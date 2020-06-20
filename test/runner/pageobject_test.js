const path = require('path');
const exec = require('child_process').exec;
const expect = require('expect');

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/pageObjects');
const codecept_run = `${runner} run`;
const config_run_config = (config, grep) => `${codecept_run} --config ${codecept_dir}/${config} ${grep ? `--grep "${grep}"` : ''}`;

describe('CodeceptJS PageObject', () => {
  before(() => {
    process.chdir(codecept_dir);
  });

  describe('Failed PageObject', () => {
    it('should fail if page objects was failed', (done) => {
      exec(`${config_run_config('codecept.fail_po.json')} --debug`, (err, stdout) => {
        const lines = stdout.split('\n');
        expect(lines).toEqual(
          expect.arrayContaining([
            expect.stringContaining('File notexistfile.js not found in'),
            expect.stringContaining('-- FAILURES'),
            expect.stringContaining('- I.seeFile("notexistfile.js")'),
            expect.stringContaining('- I.seeFile("codecept.class.js")'),
            expect.stringContaining('- I.amInPath(".")'),
          ]),
        );
        expect(stdout).toContain('FAIL  | 0 passed, 1 failed');
        expect(err).toBeTruthy();
        done();
      });
    });
  });

  describe('PageObject as Class', () => {
    it('should inject page objects by class', (done) => {
      exec(`${config_run_config('codecept.class.js', '@ClassPageObject')} --debug`, (err, stdout) => {
        expect(stdout).not.toContain('classpage.type is not a function');
        expect(stdout).toContain('classpage: type "Class Page Type"');
        expect(stdout).toContain('I print message "Class Page Type"');
        expect(stdout).toContain('classpage: purgeDomains');
        expect(stdout).toContain('I print message "purgeDomains"');
        expect(stdout).toContain('Class Page Type');
        expect(stdout).toContain('OK  | 1 passed');
        expect(err).toBeFalsy();
        done();
      });
    });

    it('should inject page objects by class which nested base clas', (done) => {
      exec(`${config_run_config('codecept.class.js', '@NestedClassPageObject')} --debug`, (err, stdout) => {
        expect(stdout).not.toContain('classnestedpage.type is not a function');
        expect(stdout).toContain('classnestedpage: type "Nested Class Page Type"');
        expect(stdout).toContain('user => User1');
        expect(stdout).toContain('I print message "Nested Class Page Type"');
        expect(stdout).toContain('classnestedpage: purgeDomains');
        expect(stdout).toContain('I print message "purgeDomains"');
        expect(stdout).toContain('Nested Class Page Type');
        expect(stdout).toContain('OK  | 1 passed');
        expect(err).toBeFalsy();
        done();
      });
    });
  });

  describe('Show MetaSteps in Log', () => {
    it('should display meta steps and substeps', (done) => {
      exec(`${config_run_config('codecept.po.json')} --debug`, (err, stdout) => {
        const lines = stdout.split('\n');
        expect(lines).toEqual(
          expect.arrayContaining([
            '  check current dir',
            '    I: openDir "aaa"',
            '      I am in path "."',
            '      I see file "codecept.class.js"',
            '    MyPage: hasFile "First arg", "Second arg"',
            '      I see file "codecept.class.js"',
            '      I see file "codecept.po.json"',
            '    I see file "codecept.po.json"',
          ]),
        );
        expect(stdout).toContain('OK  | 1 passed');
        expect(err).toBeFalsy();
        done();
      });
    });
  });

  describe('Inject PO in Test', () => {
    it('should work with inject() keyword', (done) => {
      exec(`${config_run_config('codecept.inject.po.json', 'check current dir')} --debug`, (err, stdout) => {
        const lines = stdout.split('\n');
        expect(stdout).toContain('injected');
        expect(lines).toEqual(
          expect.arrayContaining([
            '  check current dir',
            '    I: openDir "aaa"',
            '      I am in path "."',
            '      I see file "codecept.class.js"',
            '    MyPage: hasFile "uu"',
            '      I see file "codecept.class.js"',
            '      I see file "codecept.po.json"',
            '    I see file "codecept.po.json"',
          ]),
        );
        expect(stdout).toContain('OK  | 1 passed');
        expect(err).toBeFalsy();
        done();
      });
    });
  });

  describe('PageObject with context', () => {
    it('should work when used "this" context on method', (done) => {
      exec(`${config_run_config('codecept.inject.po.json', 'pageobject with context')} --debug`, (err, stdout) => {
        const lines = stdout.split('\n');
        expect(lines).toEqual(
          expect.arrayContaining([
            '  pageobject with context',
            '    I: openDir "aaa"',
            '      I am in path "."',
            '      I see file "codecept.class.js"',
            '    MyPage: hasFile "uu"',
            '      I see file "codecept.class.js"',
            '      I see file "codecept.po.json"',
            '    I see file "codecept.po.json"',
          ]),
        );
        expect(stdout).toContain('OK  | 1 passed');
        expect(err).toBeFalsy();
        done();
      });
    });
  });

  describe('Inject PO in another PO', () => {
    it('should inject page objects via proxy', (done) => {
      exec(`${config_run_config('../../../inject-fail-example')} --debug`, (err, stdout) => {
        expect(stdout).toContain('newdomain');
        expect(stdout).toContain("[ 'veni', 'vedi', 'vici' ]", 'array objects work');
        expect(stdout).toContain('OK  | 1 passed');
        expect(err).toBeFalsy();
        done();
      });
    });
  });
});
