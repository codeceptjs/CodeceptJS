import path from 'path';
import { exec } from 'child_process';
import assert from 'assert';
import { expect } from 'chai';

const __dirname = path.resolve('.');
const runner = path.join(__dirname, 'bin/codecept.js');
const codecept_dir = path.join(__dirname, 'test/data/sandbox/configs/skip');
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.conf.js `;

describe('Skip', () => {
  it('should skip test with skip', (done) => {
    exec(`${codecept_run}`, (err, stdout) => {
      expect(stdout).to.include('S @skip');
      expect(stdout).to.include('S @skip with opts');
      expect(stdout).to.not.include('skip test not passed');
      expect(stdout).to.include('✔ @NotSkip in');
      assert(!err);
      done();
    });
  });

  it('should correctly pass custom opts for skip test', (done) => {
    exec(`${codecept_run}`, (err, stdout) => {
      expect(stdout).to.include('test @skip with opts was marked for skip with customOpts: "Custom options for skip"');
      assert(!err);
      done();
    });
  });
});
