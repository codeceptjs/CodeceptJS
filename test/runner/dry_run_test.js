const path = require('path');
const { expect } = require('expect');
const { exec } = require('child_process');

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox');
const codecept_run = `${runner} dry-run`;
const codecept_run_config = (config, grep) => `${codecept_run} --config ${codecept_dir}/${config} ${grep ? `--grep "${grep}"` : ''}`;
const char = require('figures').checkboxOff;

describe('dry-run command', () => {
  before(() => {
    process.chdir(codecept_dir);
  });

  it('should be executed with config path', (done) => {
    process.chdir(__dirname);
    exec(`${codecept_run_config('codecept.js')}`, (err, stdout) => {
      expect(stdout).toContain('Filesystem'); // feature
      expect(stdout).toContain('check current dir'); // test name
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should list all tests', (done) => {
    process.chdir(__dirname);
    exec(`${codecept_run_config('codecept.js')}`, (err, stdout) => {
      expect(stdout).toContain('Filesystem'); // feature
      expect(stdout).toContain('check current dir'); // test name
      expect(stdout).toContain('No tests were executed');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should not run actual steps', (done) => {
    exec(`${codecept_run_config('codecept.flaky.js')}`, (err, stdout) => {
      expect(stdout).toContain('Flaky'); // feature
      expect(stdout).toContain('Not so flaky test'); // test name
      expect(stdout).toContain('Old style flaky'); // test name
      expect(stdout).toContain('No tests were executed');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should not run helper hooks', (done) => {
    exec(`${codecept_run_config('codecept.testhooks.json')} --debug`, (err, stdout) => {
      const lines = stdout.match(/\S.+/g);

      expect(lines).not.toEqual(
        expect.arrayContaining([
          'Helper: I\'m initialized',
          'Helper: I\'m simple BeforeSuite hook',
          'Helper: I\'m simple Before hook',
          'Helper: I\'m simple After hook',
          'Helper: I\'m simple AfterSuite hook',
        ]),
      );

      expect(lines).toEqual(
        expect.arrayContaining([
          'Test: I\'m simple BeforeSuite hook',
          'Test: I\'m simple Before hook',
          'Test: I\'m simple After hook',
          'Test: I\'m simple AfterSuite hook',
        ]),
      );

      expect(stdout).toContain('No tests were executed');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should display meta steps and substeps', (done) => {
    exec(`${codecept_run_config('configs/pageObjects/codecept.po.js')} --debug`, (err, stdout) => {
      let lines = stdout.split('\n');
      lines = lines.map(line => line.trim());
      expect(lines).toEqual(
        expect.arrayContaining([
          '\x1B[35m\x1B[1mcheck current dir\x1B[22m\x1B[39m',
          '\x1B[36m› Test Timeout: 10000s\x1B[39m',
          'I open dir "aaa"',
          '\x1B[32mI am in path "."\x1B[39m',
          'I see file "codecept.class.js"',
          'On MyPage: has file "First arg", "Second arg"',
          '\x1B[32mI see file "codecept.class.js"\x1B[39m',
          '\x1B[32mI see file "codecept.po.js"\x1B[39m',
          'I see file "codecept.po.js"',
        ]),
      );
      expect(stdout).toContain('No tests were executed');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should run feature files', (done) => {
    exec(codecept_run_config('codecept.bdd.js') + ' --steps --grep "Checkout process"', (err, stdout) => { //eslint-disable-line
      expect(stdout).toContain('Checkout process'); // feature
      expect(stdout).toContain('-- before checkout --');
      expect(stdout).toContain('-- after checkout --');
      // expect(stdout).toContain('In order to buy products'); // test name
      expect(stdout).toContain('Given I have product with $600 price');
      expect(stdout).toContain('And I have product with $1000 price');
      expect(stdout).toContain('Then I should see that total number of products is 2');
      expect(stdout).toContain('And my order amount is $1600');
      expect(stdout).not.toContain('I add item 600'); // 'Given' actor's non-gherkin step check
      expect(stdout).not.toContain('I see sum 1600'); // 'And' actor's non-gherkin step check
      expect(stdout).toContain('No tests were executed');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should print substeps in debug mode', (done) => {
    exec(codecept_run_config('codecept.bdd.js') + ' --debug --grep "Checkout process @important"', (err, stdout) => { //eslint-disable-line
      expect(stdout).toContain('Checkout process'); // feature
      // expect(stdout).toContain('In order to buy products'); // test name
      expect(stdout).toContain('Given I have product with $600 price');
      expect(stdout).toContain('I add item 600');
      expect(stdout).toContain('And I have product with $1000 price');
      expect(stdout).toContain('I add item 1000');
      expect(stdout).toContain('Then I should see that total number of products is 2');
      expect(stdout).toContain('I see num 2');
      expect(stdout).toContain('And my order amount is $1600');
      expect(stdout).toContain('I see sum 1600');
      expect(stdout).toContain('No tests were executed');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should run tests with different data', (done) => {
    exec(`${codecept_run_config('codecept.ddt.js')} --debug`, (err, stdout) => {
      const output = stdout.replace(/in [0-9]ms/g, '').replace(/\r/g, '');
      expect(output).toContain('11 passed');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should work with inject() keyword', (done) => {
    exec(`${codecept_run_config('configs/pageObjects/codecept.inject.po.js', 'check current dir')} --debug`, (err, stdout) => {
      let lines = stdout.split('\n');
      expect(stdout).toContain('injected');
      lines = lines.map(line => line.trim());

      expect(lines).toEqual(
        expect.arrayContaining([
          'I open dir "aaa"',
          '\x1B[32mI am in path "."\x1B[39m',
          'I see file "codecept.class.js"',
          'On MyPage: has file "uu"',
          '\x1B[32mI see file "codecept.class.js"\x1B[39m',
          '\x1B[32mI see file "codecept.po.js"\x1B[39m',
          'I see file "codecept.po.js"',
        ]),
      );
      expect(stdout).toContain('1 passed');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should inject page objects via proxy', (done) => {
    exec(`${codecept_run_config('../inject-fail-example')} --debug`, (err, stdout) => {
      let lines = stdout.split('\n');
      lines = lines.map(line => line.trim());

      expect(lines).toEqual(
        expect.arrayContaining([
          "strategy [ \x1B[32m'veni'\x1B[39m, \x1B[32m'vedi'\x1B[39m, \x1B[32m'vici'\x1B[39m ]",
        ]),
      );
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should enable all plugins in dry-mode when passing -p all', (done) => {
    exec(`${codecept_run_config('codecept.customLocator.js')} --verbose -p all`, (err, stdout) => {
      expect(stdout).toContain('Plugins: screenshotOnFail, customLocator');
      expect(stdout).toContain('I see element {xpath: .//*[@data-testid=\'COURSE\']//a}');
      expect(stdout).toContain('1 passed');
      expect(stdout).toContain('--- DRY MODE: No tests were executed ---');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should enable a particular plugin in dry-mode when passing it to -p', (done) => {
    exec(`${codecept_run_config('codecept.customLocator.js')} --verbose -p customLocator`, (err, stdout) => {
      expect(stdout).toContain('Plugins: customLocator');
      expect(stdout).toContain('I see element {xpath: .//*[@data-testid=\'COURSE\']//a}');
      expect(stdout).toContain('1 passed');
      expect(stdout).toContain('--- DRY MODE: No tests were executed ---');
      expect(err).toBeFalsy();
      done();
    });
  });
});
