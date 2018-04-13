const path = require('path');
const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox');
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.within.json `;

const getLines = function (array, startString, endString) {
  let startIndex;
  let endIndex;
  array.every((elem, index) => {
    if (elem === startString) {
      startIndex = index;
      return true;
    }
    if (elem === endString) {
      endIndex = index;
      return false;
    }
    return true;
  });
  return array.slice(startIndex + 1, endIndex);
};
let testStatus;

describe('CodeceptJS within', function () {
  this.timeout(40000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox');
  });

  it('should execute if no generators', (done) => {
    exec(`${codecept_run} --steps`, (err, stdout, stderr) => {
      console.log(stdout);
      const lines = stdout.match(/\S.+/g);

      const withoutGeneratorList = getLines(lines, 'Check within without generator', 'Check within with generator. Yield is first in order');
      testStatus = withoutGeneratorList.pop();
      testStatus.should.include('OK');
      withoutGeneratorList.should.eql([
        '• I small promise ',
        '• small Promise was finished',
        'Within blabla:',
        '• Hey! I am within Begin. I get blabla',
        '• Within blabla: I small promise ',
        '• small Promise was finished',
        '• oh! I am within end(',
      ], 'check steps execution order');
      done();
    });
  });

  it('should execute with generators. Yield is first in order', (done) => {
    exec(`${codecept_run} --steps`, (err, stdout, stderr) => {
      const lines = stdout.match(/\S.+/g);

      const withGeneratorList = getLines(lines, 'Check within with generator. Yield is first in order', 'Check within with generator. Yield is second in order');
      testStatus = withGeneratorList.pop();
      testStatus.should.include('OK');
      withGeneratorList.should.eql([
        '• I small promise ',
        '• small Promise was finished',
        '• I small yield ',
        'I am small yield string',
        'Within blabla:',
        '• Hey! I am within Begin. I get blabla',
        '• Within blabla: I small yield ',
        'I am small yield string',
        '• Within blabla: I small promise ',
        '• small Promise was finished',
        '• oh! I am within end(',
      ], 'check steps execution order');

      done();
    });
  });

  it('should execute with generators. Yield is second in order', (done) => {
    exec(`${codecept_run} --steps`, (err, stdout, stderr) => {
      const lines = stdout.match(/\S.+/g);

      const withGeneratorListOtherOrder = getLines(lines, 'Check within with generator. Yield is second in order', 'Check within with generator. Should complete test steps after within');
      testStatus = withGeneratorListOtherOrder.pop();
      testStatus.should.include('OK');
      withGeneratorListOtherOrder.should.eql([
        '• I small promise ',
        '• small Promise was finished',
        '• I small yield ',
        'I am small yield string',
        'Within blabla:',
        '• Hey! I am within Begin. I get blabla',
        '• Within blabla: I small promise ',
        '• small Promise was finished',
        '• Within blabla: I small yield ',
        'I am small yield string',
        '• oh! I am within end(',
      ], 'check steps execution order');

      done();
    });
  });

  it('should execute with async/await. Await is first in order', (done) => {
    exec(`${codecept_run} --steps`, (err, stdout, stderr) => {
      const lines = stdout.match(/\S.+/g);

      const withGeneratorList = getLines(lines, 'Check within with async/await. Await is first in order', 'Check within with async/await. Await is second in order');
      testStatus = withGeneratorList.pop();
      testStatus.should.include('OK');
      withGeneratorList.should.eql([
        '• I small promise ',
        '• small Promise was finished',
        '• I small yield ',
        'I am small yield string await',
        'Within blabla:',
        '• Hey! I am within Begin. I get blabla',
        '• Within blabla: I small yield ',
        'I am small yield string await',
        '• Within blabla: I small promise ',
        '• small Promise was finished',
        '• oh! I am within end(',
      ], 'check steps execution order');

      done();
    });
  });

  it('should execute with async/await. Await is second in order', (done) => {
    exec(`${codecept_run} --steps`, (err, stdout, stderr) => {
      const lines = stdout.match(/\S.+/g);

      const withGeneratorList = getLines(lines, 'Check within with async/await. Await is second in order', '-- FAILURES:');
      testStatus = withGeneratorList.pop();
      testStatus.should.include('OK');
      withGeneratorList.should.eql([
        '• I small promise ',
        '• small Promise was finished',
        '• I small yield ',
        'I am small yield string await',
        'Within blabla:',
        '• Hey! I am within Begin. I get blabla',
        '• Within blabla: I small promise ',
        '• small Promise was finished',
        '• Within blabla: I small yield ',
        'I am small yield string await',
        '• oh! I am within end(',
      ], 'check steps execution order');

      done();
    });
  });


  it('should complete test steps after within', (done) => {
    exec(`${codecept_run} --steps`, (err, stdout, stderr) => {
      const lines = stdout.match(/\S.+/g);

      const withGeneratorListWithContinued = getLines(lines, 'Check within with generator. Should complete test steps after within', 'Check within with generator. Should stop test execution after fail in within');
      testStatus = withGeneratorListWithContinued.pop();
      testStatus.should.include('OK');
      withGeneratorListWithContinued.should.eql([
        '• I small yield ',
        'I am small yield string',
        'Within blabla:',
        '• Hey! I am within Begin. I get blabla',
        '• Within blabla: I small yield ',
        'I am small yield string',
        '• Within blabla: I small promise ',
        '• small Promise was finished',
        '• oh! I am within end(',
        '• I small promise ',
        '• small Promise was finished',
      ], 'check steps execution order');
      done();
    });
  });

  it('should stop test execution after fail in within', (done) => {
    exec(`${codecept_run} --steps`, (err, stdout, stderr) => {
      const lines = stdout.match(/\S.+/g);

      const errorInWithinList = getLines(lines, 'Check within with generator. Should stop test execution after fail in within', 'Check within with generator. Should stop test execution after fail in main block');
      testStatus = errorInWithinList.pop();
      testStatus.should.include('FAILED');
      errorInWithinList.should.eql([
        '• I small yield ',
        'I am small yield string',
        'Within blabla:',
        '• Hey! I am within Begin. I get blabla',
        '• Within blabla: I error step ',
        '• oh! I am within end(',
      ], 'check steps execution order');

      done();
    });
  });

  it('should stop test execution after fail in main block', (done) => {
    exec(`${codecept_run} --steps`, (err, stdout, stderr) => {
      const lines = stdout.match(/\S.+/g);

      const errorInTestList = getLines(lines, 'Check within with generator. Should stop test execution after fail in main block', 'Check within with async/await. Await is first in order');
      testStatus = errorInTestList.pop();
      testStatus.should.include('FAILED');
      errorInTestList.should.eql([
        '• I error step ',
        '• oh! I am within end(',
      ], 'check steps execution order');

      done();
    });
  });

  it('should return correct result after tests', (done) => {
    exec(`${codecept_run} --steps`, (err, stdout, stderr) => {
      stdout.should.include(' FAIL  | 6 passed, 2 failed');

      done();
    });
  });
});
