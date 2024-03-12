import path from 'path';
import { exec } from 'child_process';
import assert from 'assert';

const __dirname = path.resolve('.');
const runner = path.join(__dirname, 'bin/codecept.js');
const codecept_dir = path.join(__dirname, 'test/data/sandbox/configs/translation.js');
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.conf.js `;

describe('Translation', () => {
  it('Should run translated test file', (done) => {
    exec(`${codecept_run}`, (err) => {
      assert(!err);
      done();
    });
  });
});
