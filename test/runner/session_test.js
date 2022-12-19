const path = require('path');
const exec = require('child_process').exec;
const { grepLines } = require('../../lib/utils').test;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox');
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.session.json `;

describe('CodeceptJS session', function () {
  this.timeout(40000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox');
  });

  it('should run with 3 sessions', (done) => {
    exec(`${codecept_run} --steps --grep "@1"`, (err, stdout) => {
      const lines = stdout.match(/\S.+/g);

      const list = grepLines(lines, 'basic session @1');
      list.pop();
      testStatus = list.pop();
      testStatus.should.include('OK');
      list.toEqual([
        'I do "writing"',
        'davert: I do "reading"',
        'I do "playing"',
        'john: I do "crying"',
        'davert: I do "smiling"',
        'I do "laughing"',
        'mike: I do "spying"',
        'john: I do "lying"',
        'I do "waving"',
      ], 'check steps execution order');
      done();
    });
  });

  it('should run session defined before executing', (done) => {
    exec(`${codecept_run} --steps --grep "@2"`, (err, stdout) => {
      const lines = stdout.match(/\S.+/g);

      const list = grepLines(lines, 'session defined not used @2');
      list.pop();
      testStatus = list.pop();
      testStatus.should.include('OK');

      list.toEqual([
        'I do "writing"',
        'I do "playing"',
        'john: I do "crying"',
        'davert: I do "smiling"',
        'I do "laughing"',
        'davert: I do "singing"',
        'I do "waving"',
      ], 'check steps execution order');
      done();
    });
  });

  it('should run all session tests', (done) => {
    exec(`${codecept_run} --steps`, (err, stdout) => {
      const lines = stdout.match(/\S.+/g);
      const testStatus = lines.pop();
      testStatus.should.include('passed');
      testStatus.should.not.include(' 1 ', 'more than 1 test expected');
      done();
    });
  });
});
