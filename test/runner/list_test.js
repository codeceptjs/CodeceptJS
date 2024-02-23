import assert from 'assert';
import path from 'path';
import { exec } from 'child_process';

const __dirname = path.resolve('.');
const runner = path.join(__dirname, 'bin/codecept.js');
const codecept_dir = path.join(__dirname, 'test/data/sandbox');

describe('list commands', () => {
  it('list should print actions', (done) => {
    exec(`${runner} list ${codecept_dir}`, (err, stdout) => {
      expect(stdout).to.include('FileSystem'); // helper name
      expect(stdout).to.include('FileSystem I.amInPath(openPath)'); // action name
      expect(stdout).to.include('FileSystem I.seeFile(name)');
      assert(!err);
      done();
    });
  });
});
