import path, { dirname } from 'path';
import { exec } from 'node:child_process';
import { expect } from 'chai';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const runner = path.join(__dirname, '../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '../../test/data/sandbox');
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.beforetest.failure.js`;

describe('Failure in before', () => {
  it('should skip tests that are skipped because of failure in before hook', (done) => {
    exec(`${codecept_run}`, (err, stdout) => {
      expect(stdout).to.include('First test will be passed @grep');
      expect(stdout).to.include('Third test will be skipped @grep');
      expect(stdout).to.include('Fourth test will be skipped');
      expect(stdout).to.include('1 passed, 1 failed, 2 skipped');
      expect(err.code).to.eql(1);
      done();
    });
  });

  it('should skip tests correctly with grep options', (done) => {
    exec(`${codecept_run} --grep @grep`, (err, stdout) => {
      expect(stdout).to.include('First test will be passed');
      expect(stdout).to.include('Third test will be skipped @grep');
      expect(stdout).to.include('1 passed, 1 failed, 1 skipped');
      expect(err.code).to.eql(1);
      done();
    });
  });

  it('should trigger skipped events', (done) => {
    exec(`DEBUG=codeceptjs:* ${codecept_run} --verbose`, (err, stdout, stderr) => {
      expect(err.code).to.eql(1);
      expect(stdout).to.include('Emitted | test.skipped');
      done();
    });
  });
}).timeout(40000);
