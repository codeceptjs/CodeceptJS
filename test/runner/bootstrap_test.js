const assert = require('assert');
const path = require('path');
const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/hermiona.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/bootstrap');
const codecept_run = `${runner} run`;
const codecept_run_config = (config, grep) => `${codecept_run} --config ${codecept_dir}/${config} ${grep ? `--grep ${grep}` : ''}`;
const config_run_override = (config, override) => `${codecept_run} --config ${codecept_dir}/${config} --override '${JSON.stringify(override)}'`;

describe('CodeceptJS Bootstrap and Teardown', () => {
  // success
  it('should run bootstrap', (done) => {
    exec(codecept_run_config('bootstrap.conf.js', '@important'), (err, stdout) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      stdout.should.include('I am teardown');
      const lines = stdout.split('\n');
      const bootstrapIndex = lines.findIndex(l => l === 'I am bootstrap');
      const testIndex = lines.findIndex(l => l.indexOf('Filesystem @main') === 0);
      const teardownIndex = lines.findIndex(l => l === 'I am teardown');
      assert(testIndex > bootstrapIndex, `${testIndex} (test) > ${bootstrapIndex} (bootstrap)`);
      assert(teardownIndex > testIndex, `${teardownIndex} (teardown) > ${testIndex} (test)`);
      assert(!err);
      done();
    });
  });

  it('should run async bootstrap', (done) => {
    exec(codecept_run_config('bootstrap.async.conf.js', '@important'), (err, stdout) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      stdout.should.include('I am teardown');
      const lines = stdout.split('\n');
      const bootstrap0Index = lines.indexOf('I am 0 bootstrap');
      const teardown0Index = lines.indexOf('I am 0 teardown');
      const bootstrapIndex = lines.findIndex(l => l === 'I am bootstrap');
      const testIndex = lines.findIndex(l => l.indexOf('Filesystem @main') === 0);
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
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      stdout.should.include('✖ check current dir @slow @important');
      stdout.should.include('I am teardown');
      done();
    });
  });

  it('should fail with code 1 when test failed and async bootstrap/teardown function without args', (done) => {
    exec(config_run_override('bootstrap.async.conf.js', { tests: './failed_test.js' }), (err, stdout) => {
      assert(err);
      assert.equal(err.code, 1);
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      stdout.should.include('✖ check current dir @slow @important');
      stdout.should.include('I am teardown');
      done();
    });
  });

  // with teardown and fail bootstrap - teardown not call
  it('should fail with code 1 when async bootstrap failed and not call teardown', (done) => {
    exec(codecept_run_config('without.args.failed.bootstrap.async.func.js'), (err, stdout) => {
      assert(err);
      assert.equal(err.code, 1);
      stdout.should.include('Error from async bootstrap');
      stdout.should.not.include('✔ check current dir @slow @important in 2ms');
      stdout.should.not.include('I am teardown');
      done();
    });
  });
});
