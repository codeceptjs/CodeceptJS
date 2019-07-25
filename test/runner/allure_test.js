const assert = require('assert');
const path = require('path');
const exec = require('child_process').exec;
const fs = require('fs');

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/allure');
const codecept_run = `${runner} run`;
const codecept_run_config = (config, grep) => `${codecept_run} --config ${codecept_dir}/${config} ${grep ? `--grep ${grep}` : ''}`;


describe('CodeceptJS Allure Plugin', () => {
  afterEach(() => {
    fs.readdir(path.join(codecept_dir, 'output/ansi'), (err, files) => {
      files.forEach((file) => {
        fs.unlinkSync(path.join(codecept_dir, 'output/ansi', file));
      });
    });
  });

  it('should create xml file when assert message has ansi symbols', (done) => {
    exec(codecept_run_config('failed_ansi.conf.js'), (err, stdout, stderr) => {
      assert(err);
      fs.readdir(path.join(codecept_dir, 'output/ansi'), (err, files) => {
        assert.equal(files.length, 1);
      });
      done();
    });
  });
});
