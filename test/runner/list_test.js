const assert = require('assert');
const path = require('path');
const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/hermiona.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox');

describe('list commands', () => {
  it('list should print actions', (done) => {
    exec(`${runner} list ${codecept_dir}`, (err, stdout) => {
      stdout.should.include('FileSystem'); // helper name
      stdout.should.include('FileSystem I.amInPath(openPath)'); // action name
      stdout.should.include('FileSystem I.seeFile(name)');
      assert(!err);
      done();
    });
  });
});
