'use strict';
let should = require('chai').should();
let assert = require('assert');
let path = require('path');
const exec = require('child_process').exec;
let runner = path.join(__dirname, '/../../bin/codecept.js');
let codecept_dir = path.join(__dirname, '/../data/sandbox')
let codecept_run = runner +' run';
let codecept_run_config = (config) => `${codecept_run} --config ${codecept_dir}/${config}`;
let config_run_override = (config) => `${codecept_run} --config ${codecept_dir} --override '${JSON.stringify(config)}'`;
let fs;

describe('CodeceptJS Runner', () => {

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox');
  });

  it('should be executed in current dir', (done) => {
    process.chdir(codecept_dir);
    exec(codecept_run, (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('check current dir'); // test name
      assert(!err);
      done();
    });
  });



  it('should be executed with config path', (done) => {
    exec(codecept_run + ' -c '+codecept_dir, (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('check current dir'); // test name
      assert(!err);
      done();
    });
  });

  it('should show failures and exit with 1 on fail', (done) => {
    exec(codecept_run_config('codecept.failed.json'), (err, stdout, stderr) => {
      stdout.should.include('Not-A-Filesystem');
      stdout.should.include('file is not in dir');
      stdout.should.include('FAILURES');
      err.code.should.eql(1);
      done();
    });
  });

  it('should run bootstrap', (done) => {
    exec(codecept_run_config('codecept.bootstrap.sync.json'), (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      assert(!err);
      done();
    });
  });

  it('should run teardown', (done) => {
    exec(config_run_override({teardown: 'bootstrap.sync.js'}), (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      assert(!err);
      done();
    });
  });

  it('should run async bootstrap', (done) => {
    exec(config_run_override({bootstrap: 'bootstrap.async.js'}), (err, stdout, stderr) => {
      stdout.should.include('Ready: 0');
      stdout.should.include('Go: 1');
      stdout.should.include('Filesystem'); // feature
      assert(!err);
      done();
    });
  });

  it('should run hooks', (done) => {
    exec(codecept_run_config('codecept.hooks.js'), (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      stdout.should.include('I am function hook');
      assert(!err);
      done();
    });
  });

  it('should run bootstrap/teardown as object', (done) => {
    exec(codecept_run_config('codecept.bootstrap.obj.json'), (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('I am bootstrap');
      stdout.should.include('I am teardown');
      assert(!err);
      done();
    });
  });

  it('should run dynamic config', (done) => {
    console.log(codecept_run_config('config.js'));
    exec(codecept_run_config('config.js'), (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      assert(!err);
      done();
    });
  });

  it('should run dynamic config with profile', (done) => {
    exec(codecept_run_config('config.js') + ' --profile failed', (err, stdout, stderr) => {
      stdout.should.include('FAILURES');
      stdout.should.not.include('I am bootstrap');
      assert(err.code);
      done();
    });
  });

  it('should run dynamic config with profile 2', (done) => {
    exec(codecept_run_config('config.js') + ' --profile bootstrap', (err, stdout, stderr) => {
      stdout.should.not.include('FAILURES'); // feature
      stdout.should.include('I am bootstrap');
      assert(!err);
      done();
    });
  });

});