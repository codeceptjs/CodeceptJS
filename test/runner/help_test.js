import assert from 'assert';
import { expect } from 'chai';
import path, { dirname } from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const runner = path.join(__dirname, '../../bin/codecept.js');

describe('help option', () => {
  it('should print help message with --help option', (done) => {
    exec(`${runner} --help`, (err, stdout) => {
      expect(stdout).to.include('Usage:');
      expect(stdout).to.include('Options:');
      expect(stdout).to.include('Commands:');
      assert(!err);
      done();
    });
  });

  it('should print help message with -h option', (done) => {
    exec(`${runner} -h`, (err, stdout) => {
      expect(stdout).to.include('Usage:');
      expect(stdout).to.include('Options:');
      expect(stdout).to.include('Commands:');
      assert(!err);
      done();
    });
  });

  it('should print help message with no option', (done) => {
    exec(`${runner}`, (err, stdout) => {
      expect(stdout).to.include('Usage:');
      expect(stdout).to.include('Options:');
      expect(stdout).to.include('Commands:');
      assert(!err);
      done();
    });
  });
});
