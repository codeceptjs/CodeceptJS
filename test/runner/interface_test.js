const assert = require('assert');
const path = require('path');
const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox');
const codecept_run = `${runner} run`;
const config_run_config = config => `${codecept_run} --config ${codecept_dir}/${config}`;

describe('CodeceptJS Interface', () => {
  before(() => {
    process.chdir(codecept_dir);
  });

  it('should rerun flaky tests', (done) => {
    exec(config_run_config('codecept.flaky.json'), (err, stdout) => {
      stdout.should.include('Flaky'); // feature
      stdout.should.include('Not so flaky test'); // test name
      stdout.should.include('Old style flaky'); // test name
      stdout.should.include('[T1] Retries: 2'); // test name
      stdout.should.include('[T2] Retries: 4'); // test name
      stdout.should.include('[T3] Retries: 1'); // test name
      assert(!err);
      done();
    });
  });

  it('should rerun retried steps', (done) => {
    exec(`${config_run_config('codecept.retry.json')} --grep @test1`, (err, stdout) => {
      stdout.should.include('Retry'); // feature
      stdout.should.include('Retries: 4'); // test name
      assert(!err);
      done();
    });
  });

  it('should not propagate retries to non retried steps', (done) => {
    exec(`${config_run_config('codecept.retry.json')} --grep @test2 --verbose`, (err, stdout) => {
      stdout.should.include('Retry'); // feature
      stdout.should.include('Retries: 1'); // test name
      assert(err);
      done();
    });
  });

  it('should use retryFailedStep plugin for failed steps', (done) => {
    exec(`${config_run_config('codecept.retryFailed.json')} --grep @test1`, (err, stdout) => {
      stdout.should.include('Retry'); // feature
      stdout.should.include('Retries: 5'); // test name
      assert(!err);
      done();
    });
  });

  it('should not retry wait* steps in retryFailedStep plugin', (done) => {
    exec(`${config_run_config('codecept.retryFailed.json')} --grep @test2`, (err, stdout) => {
      stdout.should.include('Retry'); // feature
      stdout.should.not.include('Retries: 5');
      stdout.should.include('Retries: 1');
      assert(err);
      done();
    });
  });

  it('should not retry steps if retryFailedStep plugin disabled', (done) => {
    exec(`${config_run_config('codecept.retryFailed.json')} --grep @test3`, (err, stdout) => {
      stdout.should.include('Retry'); // feature
      stdout.should.not.include('Retries: 5');
      stdout.should.include('Retries: 1');
      assert(err);
      done();
    });
  });

  it('should include grep option tests', (done) => {
    exec(config_run_config('codecept.grep.json'), (err, stdout) => {
      stdout.should.include('Got login davert and password'); // feature
      stdout.should.not.include('Got changed login'); // test name
      assert(!err);
      done();
    });
  });

  it('should run tests with different data', (done) => {
    exec(config_run_config('codecept.ddt.json'), (err, stdout) => {
      const output = stdout.replace(/in [0-9]ms/g, '').replace(/\r/g, '');
      output.should.include(`Got login davert and password 123456
  ✔ Should log accounts1 | {"login":"davert","password":"123456"}`);

      output.should.include(`Got login admin and password 666666
  ✔ Should log accounts1 | {"login":"admin","password":"666666"}`);

      output.should.include(`Got changed login andrey and password 555555
  ✔ Should log accounts2 | {"login":"andrey","password":"555555"}`);

      output.should.include(`Got changed login collaborator and password 222222
  ✔ Should log accounts2 | {"login":"collaborator","password":"222222"}`);

      output.should.include(`Got changed login nick
  ✔ Should log accounts3 | ["nick","pick"]`);

      output.should.include(`Got changed login jack
  ✔ Should log accounts3 | ["jack","sacj"]`);

      output.should.include(`Got generator login nick
  ✔ Should log accounts4 | {"user":"nick"}`);

      output.should.include(`Got generator login pick
  ✔ Should log accounts4 | {"user":"pick"}`);

      output.should.include(`Got array item 1
  ✔ Should log array of strings | {"1"}`);

      output.should.include(`Got array item 2
  ✔ Should log array of strings | {"2"}`);

      output.should.include(`Got array item 3
  ✔ Should log array of strings | {"3"}`);

      assert(!err);
      done();
    });
  });

  it('should run all tests with data of array by only', (done) => {
    exec(config_run_config('codecept.addt.json'), (err, stdout) => {
      const output = stdout.replace(/in [0-9]ms/g, '').replace(/\r/g, '');
      output.should.include('Got array item 1');
      output.should.include('Should log array of strings | {"1"}');
      output.should.include('Got array item 2');
      output.should.include('Should log array of strings | {"2"}');
      output.should.include('Got array item 3');
      output.should.include('Should log array of strings | {"3"}');
      assert(!err);
      done();
    });
  });

  it('should run all tests with data of generator by only', (done) => {
    exec(config_run_config('codecept.gddt.json'), (err, stdout) => {
      const output = stdout.replace(/in [0-9]ms/g, '').replace(/\r/g, '');
      output.should.include(`Got generator login nick
  ✔ Should log generator of strings | {"user":"nick"}`);

      output.should.include(`Got generator login pick
  ✔ Should log generator of strings | {"user":"pick"}`);
      assert(!err);
      done();
    });
  });

  it('should execute expected promise chain', (done) => {
    exec(`${codecept_run} --verbose`, (err, stdout) => {
      const lines = stdout.match(/\S.+/g);

      // before hooks
      const beforeStep = [
        'Emitted | step.before (I am in path ".")',
        'Emitted | step.after (I am in path ".")',
        'Emitted | step.start (I am in path ".")',
        'I am in path "."',
      ];

      lines.filter(l => beforeStep.indexOf(l) > -1)
        .should.eql(beforeStep, 'check step hooks execution order');

      // steps order
      const step = [
        'I am in path "."',
        'hello world',
        'I see file "codecept.json"',
      ];

      lines.filter(l => step.indexOf(l) > -1)
        .should.eql(step, 'check steps execution order');

      assert(!err);
      done();
    });
  });

  it.only('should display meta steps and substeps', (done) => {
    exec(`${config_run_config('codecept.po.json')} --debug`, (err, stdout) => {
      console.log(stdout);
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
      assert(!err);
      done();
    });
  });

  it('should work with inject() keyword', (done) => {
    exec(`${config_run_config('codecept.inject.po.json')} --debug`, (err, stdout) => {
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
    exec(`${config_run_config('../inject-fail-example')} --debug`, (err, stdout) => {
      stdout.should.include('newdomain');
      stdout.should.include("[ 'veni', 'vedi', 'vici' ]", 'array objects work');
      stdout.should.include('OK  | 1 passed');
      assert(!err);
      done();
    });
  });
});
