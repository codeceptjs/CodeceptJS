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
    exec(`${codecept_run} --steps --grep "@1"`, (err, stdout, stderr) => {
      const lines = stdout.match(/\S.+/g);

      const list = grepLines(lines, 'basic session @1');
      list.pop();
      testStatus = list.pop();
      testStatus.should.include('OK');
      list.should.eql([
        '• I do "writing"',
        '• session:0.writing',
        'Session "davert":',
        '• I do "reading"',
        '• session:1.reading',
        '_______',
        '• I do "playing"',
        '• session:0.playing',
        'Session "john":',
        '• I do "crying"',
        '• session:2.crying',
        '_______',
        'Session "davert":',
        '• I do "smiling"',
        '• session:1.smiling',
        '_______',
        '• I do "laughing"',
        '• session:0.laughing',
        'Session "mike":',
        '• I do "spying"',
        '• session:3.spying',
        '_______',
        'Session "john":',
        '• I do "lying"',
        '• session:2.lying',
        '_______',
        '• I do "waving"',
        '• session:0.waving',
      ], 'check steps execution order');
      done();
    });
  });

  it('should run session defined before executing', (done) => {
    exec(`${codecept_run} --steps --grep "@2"`, (err, stdout, stderr) => {
      const lines = stdout.match(/\S.+/g);

      const list = grepLines(lines, 'session defined not used @2');
      list.pop();
      testStatus = list.pop();
      testStatus.should.include('OK');

      list.should.eql([
        '• I do "writing"',
        '• session:0.writing',
        '• I do "playing"',
        '• session:0.playing',
        'Session "john":',
        '• I do "crying"',
        '• session:2.crying',
        '_______',
        'Session "davert":',
        '• I do "smiling"',
        '• session:1.smiling',
        '_______',
        '• I do "laughing"',
        '• session:0.laughing',
        'Session "davert":',
        '• I do "singing"',
        '• session:1.singing',
        '_______',
        '• I do "waving"',
        '• session:0.waving',
      ], 'check steps execution order');
      done();
    });
  });

  it('should run all session tests', (done) => {
    exec(`${codecept_run} --steps`, (err, stdout, stderr) => {
      const lines = stdout.match(/\S.+/g);
      const testStatus = lines.pop();
      testStatus.should.include('passed');
      testStatus.should.not.include(' 1 ', 'more than 1 test expected');
      done();
    });
  });
});
