const assert = require('assert');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const { deleteDir } = require('../../lib/utils');

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/allure');
const codecept_run = `${runner} run`;
const codecept_workers = `${runner} run-workers 2`;
const codecept_run_config = (config, grep) => `${codecept_run} --config ${codecept_dir}/${config} ${grep ? `--grep ${grep}` : ''}`;
const codecept_workers_config = (config, grep) => `${codecept_workers} --config ${codecept_dir}/${config} ${grep ? `--grep ${grep}` : ''}`;


describe('CodeceptJS Allure Plugin', () => {
  beforeEach(() => {
    deleteDir(path.join(codecept_dir, 'output/ansi'));
    deleteDir(path.join(codecept_dir, 'output/success'));
    deleteDir(path.join(codecept_dir, 'output/failed'));
  });

  afterEach(() => {
    deleteDir(path.join(codecept_dir, 'output/ansi'));
    deleteDir(path.join(codecept_dir, 'output/success'));
    deleteDir(path.join(codecept_dir, 'output/failed'));
  });

  it('should enable allure reports', (done) => {
    exec(codecept_run_config('allure.conf.js'), (err) => {
      const files = fs.readdirSync(path.join(codecept_dir, 'output/success'));
      assert(!err);
      assert.equal(files.length, 1);
      assert(files[0].match(/\.xml$/), 'not a xml file');
      done();
    });
  });

  it('should create xml file when assert message has ansi symbols', (done) => {
    exec(codecept_run_config('failed_ansi.conf.js'), (err) => {
      assert(err);
      const files = fs.readdirSync(path.join(codecept_dir, 'output/ansi'));
      assert(files[0].match(/\.xml$/), 'not a xml file');
      assert.equal(files.length, 1);
      done();
    });
  });

  it('should report BeforeSuite errors when executing via run command', (done) => {
    exec(codecept_run_config('before_suite_test_failed.conf.js'), (err, stdout) => {
      stdout.should.include('FAIL  | 0 passed, 1 failed');

      const files = fs.readdirSync(path.join(codecept_dir, 'output/failed'));
      const testResultPath = files[0];
      assert(testResultPath.match(/\.xml$/), 'not a xml file');
      const file = fs.readFileSync(path.join(codecept_dir, 'output/failed', testResultPath), 'utf8');
      file.should.include('BeforeSuite of suite failing setup test suite: failed.');
      file.should.include('the before suite setup failed');
      done();
    });
  });

  it('should report BeforeSuite errors when executing via run-workers command', function (done) {
    if (parseInt(process.version.match(/\d+/), 10) < 12) {
      this.skip();
    }

    exec(codecept_workers_config('before_suite_test_failed.conf.js'), (err, stdout) => {
      stdout.should.include('FAIL  | 0 passed');

      const files = fs.readdirSync(path.join(codecept_dir, 'output/failed'));
      const testResultPath = files[0];
      assert(testResultPath.match(/\.xml$/), 'not a xml file');
      const file = fs.readFileSync(path.join(codecept_dir, 'output/failed', testResultPath), 'utf8');
      file.should.include('BeforeSuite of suite failing setup test suite: failed.');
      file.should.include('the before suite setup failed');
      done();
    });
  });
});
