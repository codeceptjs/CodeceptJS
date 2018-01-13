const assert = require('assert');
const path = require('path');
const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox');
const codecept_run = `${runner} run`;
const config_run_config = config => `${codecept_run} --config ${codecept_dir}/${config}`;
const config_run_override = config => `${codecept_run} --override '${JSON.stringify(config)}'`;

describe('CodeceptJS Interface', () => {
  before(() => {
    process.chdir(codecept_dir);
  });

  it('should rerun flaky tests', (done) => {
    exec(config_run_config('codecept.flaky.json'), (err, stdout, stderr) => {
      stdout.should.include('Flaky'); // feature
      stdout.should.include('Not so flaky test'); // test name
      assert(!err);
      done();
    });
  });

  it('should run tests with different data', (done) => {
    exec(config_run_config('codecept.ddt.json'), (err, stdout, stderr) => {
      const output = stdout.replace(/in [0-9]ms/g, '').replace(/\r/g, '');
      output.should.include(`Got login davert and password 123456
 ✓ Should log accounts1 | {"login":"davert","password":"123456"}`);

      output.should.include(`Got login admin and password 666666
 ✓ Should log accounts1 | {"login":"admin","password":"666666"}`);

      output.should.include(`Got changed login andrey and password 555555
 ✓ Should log accounts2 | {"login":"andrey","password":"555555"}`);

      output.should.include(`Got changed login collaborator and password 222222
 ✓ Should log accounts2 | {"login":"collaborator","password":"222222"}`);

      output.should.include(`Got changed login nick
 ✓ Should log accounts3 | nick`);

      output.should.include(`Got changed login jack
 ✓ Should log accounts3 | jack`);

      assert(!err);
      done();
    });
  });

  it('should execute expected promise chain', (done) => {
    exec(`${codecept_run} --verbose`, (err, stdout, stderr) => {
      const queue1 = stdout.match(/\[1\] .+/g);
      queue1.should.eql([
        '[1] Starting recording promises',
        '[1] Queued | hook FileSystem._beforeSuite()',
        '[1] Queued | hook FileSystem._before()',
        '[1] Queued | hook FileSystem._beforeStep()',
        '[1] Queued | amInPath: "."',
        '[1] Queued | hook FileSystem._afterStep()',
        '[1] Queued | step passed',
        '[1] Queued | return result',
        '[1] Queued | say hello world',
        '[1] Queued | hook FileSystem._beforeStep()',
        '[1] Queued | seeFile: "codecept.json"',
        '[1] Queued | hook FileSystem._afterStep()',
        '[1] Queued | step passed',
        '[1] Queued | return result',
        '[1] Queued | fire test.passed',
        '[1] Queued | finish test',
        '[1] Queued | hook FileSystem._after()',
        '[1] Queued | hook FileSystem._afterSuite()',
        '[1] Queued | hook FileSystem._finishTest()',
      ]);

      const lines = stdout.match(/\S.+/g);

      // before hooks
      const beforeStep = [
        'Emitted | step.before (I am in path ".")',
        'Emitted | step.after (I am in path ".")',
        'Emitted | step.start (I am in path ".")',
        '• I am in path "."',
      ];

      lines.filter(l => beforeStep.indexOf(l) > -1)
        .should.eql(beforeStep, 'check step hooks execution order');

      // steps order
      const step = [
        '• I am in path "."',
        'hello world',
        '• I see file "codecept.json"',
      ];

      lines.filter(l => step.indexOf(l) > -1)
        .should.eql(step, 'check steps execution order');

      assert(!err);
      done();
    });
  });
});
