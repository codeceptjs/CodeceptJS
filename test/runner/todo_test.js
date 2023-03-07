const path = require('path');
const exec = require('child_process').exec;
const assert = require('assert');

const runner = path.join(__dirname, '/../../bin/hermiona.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/todo');
const codecept_run = `${runner} run --config ${codecept_dir}/hermiona.conf.js `;

describe('Todo', () => {
  it('should skip test with todo', (done) => {
    exec(`${codecept_run}`, (err, stdout) => {
      stdout.should.include('S @todo');
      stdout.should.include('S @todo without function');
      stdout.should.not.include('todo test not passed');
      stdout.should.include('✔ @NotTodo in');
      assert(!err);
      done();
    });
  });

  it('should skip inject skipinfo to todo test', (done) => {
    exec(`${codecept_run}`, (err, stdout) => {
      stdout.should.include('test @todo was marked for todo with message: Test not implemented!');
      stdout.should.include('test @todo without function was marked for todo with message: Test not implemented!');
      stdout.should.not.include('test @NotTodo was marked for todo with message: Test not implemented!');
      assert(!err);
      done();
    });
  });

  it('should correctly pass custom opts for todo test', (done) => {
    exec(`${codecept_run}`, (err, stdout) => {
      stdout.should.include('test @todo with opts was marked for todo with customOpts: "Custom options for todo"');
      assert(!err);
      done();
    });
  });
});
