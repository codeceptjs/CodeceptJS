const assert = require('assert');
const path = require('path');
const expect = require('chai').expect;

const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox');
const codecept_run = `${runner} dry-run`;
const codecept_run_config = config => `${codecept_run} --config ${codecept_dir}/${config}`;
const config_run_override = config => `${codecept_run} --override '${JSON.stringify(config)}'`;
const char = require('figures').checkboxOff;

describe('dry-run command', () => {
  before(() => {
    process.chdir(codecept_dir);
  });

  it('should be executed with config path', (done) => {
    process.chdir(__dirname);
    exec(`${codecept_run} -c ${codecept_dir}`, (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('check current dir'); // test name
      assert(!err);
      done();
    });
  });

  it('should list all tests', (done) => {
    process.chdir(__dirname);
    exec(`${codecept_run} -c ${codecept_dir}`, (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('check current dir'); // test name
      stdout.should.not.include('I am in path'); // step name
      stdout.should.not.include('I see file'); // step name
      stdout.should.include('No tests were executed');
      assert(!err);
      done();
    });
  });

  it('should not run actual steps', (done) => {
    exec(codecept_run_config('codecept.flaky.json'), (err, stdout, stderr) => {
      stdout.should.include('Flaky'); // feature
      stdout.should.include('Not so flaky test'); // test name
      stdout.should.include('Old style flaky'); // test name
      stdout.should.not.include('[T1] Retries: 2');
      stdout.should.not.include('[T2] Retries: 4');
      stdout.should.not.include('[T3] Retries: 1');
      stdout.should.include('No tests were executed');
      assert(!err);
      done();
    });
  });

  it('should not run helper hooks', (done) => {
    exec(`${codecept_run_config('codecept.testhooks.json')} --debug`, (err, stdout) => {
      const lines = stdout.match(/\S.+/g);

      expect(lines).to.not.include.members([
        'Helper: I\'m initialized',
        'Helper: I\'m simple BeforeSuite hook',
        'Helper: I\'m simple Before hook',
        'Helper: I\'m simple After hook',
        'Helper: I\'m simple AfterSuite hook',
      ]);

      expect(lines).to.include.members([
        'Test: I\'m simple BeforeSuite hook',
        'Test: I\'m simple Before hook',
        'Test: I\'m simple After hook',
        'Test: I\'m simple AfterSuite hook',
      ]);

      stdout.should.include('OK  | 1 passed');
      stdout.should.include('No tests were executed');
      assert(!err);
      done();
    });
  });

  it('should display meta steps and substeps', (done) => {
    exec(`${codecept_run_config('codecept.po.json')} --debug`, (err, stdout) => {
      const lines = stdout.split('\n');
      lines.should.include.members([
        '  check current dir',
        '    I: openDir ',
        '      I am in path "."',
        '      I see file "codecept.json"',
        '    MyPage: hasFile ',
        '      I see file "codecept.json"',
        '      I see file "codecept.po.json"',
        '    I see file "codecept.po.json"',
      ]);
      stdout.should.include('OK  | 1 passed');
      stdout.should.include('No tests were executed');
      assert(!err);
      done();
    });
  });

  it('should run feature files', (done) => {
    exec(codecept_run_config('codecept.bdd.json') + ' --steps --grep "Checkout process"', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include('Checkout process'); // feature
      stdout.should.include('-- before checkout --');
      stdout.should.include('-- after checkout --');
      // stdout.should.include('In order to buy products'); // test name
      stdout.should.include('Given I have product with $600 price');
      stdout.should.include('And I have product with $1000 price');
      stdout.should.include('Then I should see that total number of products is 2');
      stdout.should.include('And my order amount is $1600');
      stdout.should.not.include('I add item 600'); // 'Given' actor's non-gherkin step check
      stdout.should.not.include('I see sum 1600'); // 'And' actor's non-gherkin step check
      stdout.should.include('No tests were executed');
      assert(!err);
      done();
    });
  });

  it('should print substeps in debug mode', (done) => {
    exec(codecept_run_config('codecept.bdd.json') + ' --debug --grep "Checkout process"', (err, stdout, stderr) => { //eslint-disable-line
      stdout.should.include('Checkout process'); // feature
      // stdout.should.include('In order to buy products'); // test name
      stdout.should.include('Given I have product with $600 price');
      stdout.should.include('I add item 600');
      stdout.should.include('And I have product with $1000 price');
      stdout.should.include('I add item 1000');
      stdout.should.include('Then I should see that total number of products is 2');
      stdout.should.include('I see num 2');
      stdout.should.include('And my order amount is $1600');
      stdout.should.include('I see sum 1600');
      stdout.should.include('No tests were executed');
      assert(!err);
      done();
    });
  });

  it('should run tests with different data', (done) => {
    exec(codecept_run_config('codecept.ddt.json'), (err, stdout, stderr) => {
      const output = stdout.replace(/in [0-9]ms/g, '').replace(/\r/g, '');
      output.should.include(`${char} Should log accounts1 | {"login":"davert","password":"123456"}`);
      output.should.include(`${char} Should log accounts1 | {"login":"admin","password":"666666"}`);
      output.should.include(`${char} Should log accounts2 | {"login":"andrey","password":"555555"}`);
      output.should.include(`${char} Should log accounts2 | {"login":"collaborator","password":"222222"}`);
      output.should.include(`${char} Should log accounts3 | ["nick","pick"]`);
      output.should.include(`${char} Should log accounts3 | ["jack","sacj"]`);
      output.should.include(`${char} Should log accounts4 | {"user":"nick"}`);
      output.should.include(`${char} Should log accounts4 | {"user":"pick"}`);
      output.should.include(`${char} Should log array of strings | {"1"}`);
      output.should.include(`${char} Should log array of strings | {"2"}`);
      output.should.include(`${char} Should log array of strings | {"3"}`);

      assert(!err);
      done();
    });
  });

  it('should display meta steps and substeps', (done) => {
    exec(`${codecept_run_config('codecept.po.json')} --debug`, (err, stdout) => {
      const lines = stdout.split('\n');
      lines.should.include.members([
        '  check current dir',
        '    I: openDir ',
        '      I am in path "."',
        '      I see file "codecept.json"',
        '    MyPage: hasFile ',
        '      I see file "codecept.json"',
        '      I see file "codecept.po.json"',
        '    I see file "codecept.po.json"',
      ]);
      stdout.should.include('OK  | 1 passed');
      stdout.should.include('No tests were executed');
      assert(!err);
      done();
    });
  });

  it('should work with inject() keyword', (done) => {
    exec(`${codecept_run_config('codecept.inject.po.json')} --debug`, (err, stdout) => {
      const lines = stdout.split('\n');
      stdout.should.include('injected');
      lines.should.include.members([
        '  check current dir',
        '    I: openDir ',
        '      I am in path "."',
        '      I see file "codecept.json"',
        '    MyPage: hasFile ',
        '      I see file "codecept.json"',
        '      I see file "codecept.po.json"',
        '    I see file "codecept.po.json"',
      ]);
      stdout.should.include('OK  | 1 passed');
      assert(!err);
      done();
    });
  });

  it('should inject page objects via proxy', (done) => {
    exec(`${codecept_run_config('../inject-fail-example')} --debug`, (err, stdout) => {
      stdout.should.include('newdomain');
      stdout.should.include("[ 'veni', 'vedi', 'vici' ]", 'array objects work');
      stdout.should.include('OK  | 1 passed');
      assert(!err);
      done();
    });
  });
});
