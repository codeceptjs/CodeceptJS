const assert = require('assert');
const path = require('path');
const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/bootstrap');
const codecept_run = `${runner} run`;
const codecept_run_config = (config, grep) => `${codecept_run} --config ${codecept_dir}/${config} ${grep ? `--grep ${grep}` : ''}`;
const config_run_override = (config, override) => `${codecept_run} --config ${codecept_dir}/${config} --override '${JSON.stringify(override)}'`;

describe('CodeceptJS Bootstrap and Teardown', () => {
  // success
  it('should run bootstrap', (done) => {
    exec(codecept_run_config('sync.json', '@important'), (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      assert(!err);
      done();
    });
  });

  it('should run teardown', (done) => {
    exec(config_run_override('../../', { teardown: 'bootstrap.sync.js' }), (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      assert(!err);
      done();
    });
  });

  it('should run async bootstrap', (done) => {
    exec(config_run_override('../../', { bootstrap: 'bootstrap.async.js' }), (err, stdout, stderr) => {
      stdout.should.include('Ready: 0');
      stdout.should.include('Go: 1');
      stdout.should.include('Filesystem'); // feature
      assert(!err);
      done();
    });
  });

  it('should run bootstrap/teardown as object', (done) => {
    exec(codecept_run_config('obj.json'), (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      stdout.should.include('I am teardown');
      assert(!err);
      done();
    });
  });

  it('should run async bootstrap function without args', (done) => {
    exec(codecept_run_config('without.args.async.func.js'), (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      assert(!err);
      done();
    });
  });

  it('should run async bootstrap function with args', (done) => {
    exec(codecept_run_config('with.args.async.func.js'), (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      assert(!err);
      done();
    });
  });

  // failed test
  it('should fail with code 1 when test failed and async bootstrap function without args', (done) => {
    exec(config_run_override('without.args.async.func.js', { tests: './failed_test.js' }), (err, stdout, stderr) => {
      assert(err);
      assert.equal(err.code, 1);
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      stdout.should.include('✖ check current dir @slow @important');
      done();
    });
  });

  it('should fail with code 1 when test failed and async bootstrap function with args', (done) => {
    exec(config_run_override('with.args.async.func.js', { tests: './failed_test.js' }), (err, stdout, stderr) => {
      assert(err);
      assert.equal(err.code, 1);
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      stdout.should.include('✖ check current dir @slow @important');
      done();
    });
  });

  // failed bootstrap
  it('should fail with code 1 when async bootstrap function without args failed', (done) => {
    exec(codecept_run_config('without.args.failed.bootstrap.async.func.js'), (err, stdout, stderr) => {
      assert.equal(err.code, 1);
      stdout.should.include('Error from async bootstrap');
      stdout.should.not.include('✔ check current dir @slow @important in 2ms');
      assert(err);
      done();
    });
  });

  it('should fail with code 1 when async bootstrap function with args failed', (done) => {
    exec(codecept_run_config('with.args.failed.bootstrap.async.func.js'), (err, stdout, stderr) => {
      assert.equal(err.code, 1);
      stdout.should.include('Error from async bootstrap');
      stdout.should.not.include('✔ check current dir @slow @important in 2ms');
      assert(err);
      done();
    });
  });

  // failed in test file
  it('should fail with code 1 when raise exceptin in the test file and async bootstrap function with args', (done) => {
    exec(config_run_override('with.args.async.func.js', { tests: './invalid_require_test.js' }), (err, stdout, stderr) => {
      assert(err);
      assert.equal(err.code, 1);
      stdout.should.include('Cannot find module \'invalidRequire\'');
      stdout.should.not.include('✔ check current dir @slow @important in 2ms');
      done();
    });
  });

  it('should fail with code 1 when raise exceptin in the test file and async bootstrap function without args', (done) => {
    exec(config_run_override('without.args.async.func.js', { tests: './invalid_require_test.js' }), (err, stdout, stderr) => {
      assert(err);
      assert.equal(err.code, 1);
      stdout.should.include('Cannot find module \'invalidRequire\'');
      stdout.should.not.include('✔ check current dir @slow @important in 2ms');
      done();
    });
  });

  // with teardown
  it('should run async bootstrap/teardown with args', (done) => {
    exec(config_run_override('with.args.bootstrap.teardown.js', { tests: './fs_test.js' }), (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      stdout.should.include('I am teardown');
      assert(!err);
      done();
    });
  });

  it('should run async bootstrap/teardown without args', (done) => {
    exec(config_run_override('without.args.bootstrap.teardown.js', { tests: './fs_test.js' }), (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      stdout.should.include('I am teardown');
      assert(!err);
      done();
    });
  });

  // with teaedown - failed tests
  it('should fail with code 1 when test failed and async bootstrap/teardown function with args', (done) => {
    exec(config_run_override('with.args.bootstrap.teardown.js', { tests: './failed_test.js' }), (err, stdout, stderr) => {
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
    exec(config_run_override('without.args.bootstrap.teardown.js', { tests: './failed_test.js' }), (err, stdout, stderr) => {
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
  it('should fail with code 1 when async bootstrap with args failed and not call teardown', (done) => {
    exec(codecept_run_config('with.args.failed.bootstrap.teardown.js'), (err, stdout, stderr) => {
      assert(err);
      assert.equal(err.code, 1);
      stdout.should.include('Error from async bootstrap');
      stdout.should.not.include('✔ check current dir @slow @important in 2ms');
      stdout.should.not.include('I am teardown');
      done();
    });
  });

  it('should fail with code 1 when async bootstrap without args failed and not call teardown', (done) => {
    exec(codecept_run_config('without.args.failed.bootstrap.teardown.js'), (err, stdout, stderr) => {
      assert(err);
      assert.equal(err.code, 1);
      stdout.should.include('Error from async bootstrap');
      stdout.should.not.include('✔ check current dir @slow @important in 2ms');
      stdout.should.not.include('I am teardown');
      done();
    });
  });
});
