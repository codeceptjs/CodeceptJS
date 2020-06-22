const path = require('path');
const exec = require('child_process').exec;
const assert = require('assert');

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/translation');
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.conf.js `;

describe('Translation', () => {
  it('Should run translated test file', (done) => {
    exec(`${codecept_run}`, (err, stdout) => {
      assert(!err);
      done();
    });
  });
});
