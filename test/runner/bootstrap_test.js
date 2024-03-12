import assert from 'assert';
import path, { dirname } from 'path';
import { exec } from 'child_process';
import { expect } from 'chai';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const runner = path.join(__dirname, '../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '../../test/data/sandbox/configs/bootstrap');
const codecept_run = `${runner} run`;
const codecept_run_config = (config, grep) => `${codecept_run} --config ${codecept_dir}/${config} ${grep ? `--grep ${grep}` : ''}`;
const config_run_override = (config, override) => `${codecept_run} --config ${codecept_dir}/${config} --override '${JSON.stringify(override)}'`;

describe('CodeceptJS Bootstrap and Teardown', function () {
  this.timeout(20000);
  // success
  it('should run bootstrap', (done) => {
    exec(codecept_run_config('bootstrap.conf.js', '@important'), (err, stdout) => {
      expect(stdout).to.include('Filesystem'); // feature
      expect(stdout).to.include('I am bootstrap');
      expect(stdout).to.include('I am teardown');
      const lines = stdout.split('\n');
      const bootstrapIndex = lines.findIndex(l => l === 'I am bootstrap');
      const testIndex = lines.findIndex(l => l.includes('Filesystem @main') === true);
      const teardownIndex = lines.findIndex(l => l === 'I am teardown');
      assert(testIndex > bootstrapIndex, `${testIndex} (test) > ${bootstrapIndex} (bootstrap)`);
      assert(teardownIndex > testIndex, `${teardownIndex} (teardown) > ${testIndex} (test)`);
      assert(!err);
      done();
    });
  });

  it('should run async bootstrap', (done) => {
    exec(codecept_run_config('bootstrap.async.conf.js', '@important'), (err, stdout) => {
      expect(stdout).to.include('Filesystem'); // feature
      expect(stdout).to.include('I am bootstrap');
      expect(stdout).to.include('I am teardown');
      const lines = stdout.split('\n');
      const bootstrap0Index = lines.indexOf('I am 0 bootstrap');
      const teardown0Index = lines.indexOf('I am 0 teardown');
      const bootstrapIndex = lines.findIndex(l => l === 'I am bootstrap');
      const testIndex = lines.findIndex(l => l.includes('Filesystem @main') === true);
      const teardownIndex = lines.findIndex(l => l === 'I am teardown');
      assert(bootstrap0Index < bootstrapIndex, `${bootstrap0Index} < ${bootstrapIndex} (bootstrap)`);
      assert(teardown0Index < teardownIndex, `${teardown0Index} < ${teardownIndex} (teardown)`);
      assert(testIndex > bootstrapIndex, `${testIndex} (test) > ${bootstrapIndex} (bootstrap)`);
      assert(teardownIndex > testIndex, `${teardownIndex} (teardown) > ${testIndex} (test)`);
      assert(!err);
      done();
    });
  });

  // with teaedown - failed tests
  it('should fail with code 1 when test failed and async bootstrap/teardown function with args', (done) => {
    exec(config_run_override('bootstrap.async.conf.js', { tests: './failed_test.js' }), (err, stdout) => {
      assert(err);
      assert.equal(err.code, 1);
      expect(stdout).to.include('Filesystem'); // feature
      expect(stdout).to.include('I am bootstrap');
      expect(stdout).to.include('check current dir @slow @important');
      expect(stdout).to.include('I am teardown');
      done();
    });
  });

  it('should fail with code 1 when test failed and async bootstrap/teardown function without args', (done) => {
    exec(config_run_override('bootstrap.async.conf.js', { tests: './failed_test.js' }), (err, stdout) => {
      assert(err);
      assert.equal(err.code, 1);
      expect(stdout).to.include('Filesystem'); // feature
      expect(stdout).to.include('I am bootstrap');
      expect(stdout).to.include('check current dir @slow @important');
      expect(stdout).to.include('I am teardown');
      done();
    });
  });

  // with teardown and fail bootstrap - teardown not call
  it('should fail with code 1 when async bootstrap failed and not call teardown', (done) => {
    exec(codecept_run_config('without.args.failed.bootstrap.async.func.js'), (err, stdout) => {
      assert(err);
      assert.equal(err.code, 1);
      expect(stdout).to.include('Error from async bootstrap');
      expect(stdout).to.not.include('✔ check current dir @slow @important in 2ms');
      expect(stdout).to.not.include('I am teardown');
      done();
    });
  });
});
