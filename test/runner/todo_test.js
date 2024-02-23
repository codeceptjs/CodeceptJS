import path from 'path';
import { exec } from 'child_process';
import assert from 'assert';
import { expect } from 'chai';

const __dirname = path.resolve('.');
const runner = path.join(__dirname, 'bin/codecept.js');
const codecept_dir = path.join(__dirname, 'test/data/sandbox/configs/todo');
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.conf.js `;

describe('Todo', () => {
  it('should skip test with todo', (done) => {
    exec(`${codecept_run}`, (err, stdout) => {
      expect(stdout).to.include('S @todo');
      expect(stdout).to.include('S @todo without function');
      expect(stdout).to.not.include('todo test not passed');
      expect(stdout).to.include('✔ @NotTodo in');
      assert(!err);
      done();
    });
  });

  it('should skip inject skipinfo to todo test', (done) => {
    exec(`${codecept_run}`, (err, stdout) => {
      expect(stdout).to.include('test @todo was marked for todo with message: Test not implemented!');
      expect(stdout).to.include('test @todo without function was marked for todo with message: Test not implemented!');
      expect(stdout).to.not.include('test @NotTodo was marked for todo with message: Test not implemented!');
      assert(!err);
      done();
    });
  });

  it('should correctly pass custom opts for todo test', (done) => {
    exec(`${codecept_run}`, (err, stdout) => {
      expect(stdout).to.include('test @todo with opts was marked for todo with customOpts: "Custom options for todo"');
      assert(!err);
      done();
    });
  });
});
