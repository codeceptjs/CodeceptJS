const path = require('path');
const exec = require('child_process').exec;
const { grepLines } = require('../../lib/utils').test;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox');
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.within.json `;

let testStatus;

describe('CodeceptJS within', function () {
  this.timeout(40000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox');
  });

  it('should execute if no generators', (done) => {
    exec(`${codecept_run} --debug`, (_err, stdout) => {
      const lines = stdout.match(/\S.+/g);

      const withoutGeneratorList = grepLines(lines, 'Check within without generator', 'Check within with generator. Yield is first in order');
      testStatus = withoutGeneratorList.pop();
      testStatus.should.include('OK');
      withoutGeneratorList.toEqual([
        'I small promise ',
        'I small  Promise was finished ',
        'I  Hey!  I am within  Begin.  I get blabla ',
        'Within "blabla" ',
        'I small promise ',
        'I small  Promise was finished ',
        'I oh!  I am within end( ',
      ], 'check steps execution order');
      done();
    });
  });

  it('should execute with async/await. Await is first in order', (done) => {
    exec(`${codecept_run} --debug`, (_err, stdout) => {
      const lines = stdout.match(/\S.+/g);

      const withGeneratorList = grepLines(lines, 'Check within with async/await. Await is first in order', 'Check within with async/await. Await is second in order');
      testStatus = withGeneratorList.pop();
      testStatus.should.include('OK');
      withGeneratorList.toEqual([
        'I small promise ',
        'I small  Promise was finished ',
        'I small yield ',
        'I am small yield string await',
        'I  Hey!  I am within  Begin.  I get blabla ',
        'Within "blabla" ',
        'I small yield ',
        'I am small yield string await',
        'I small promise ',
        'I small  Promise was finished ',
        'I oh!  I am within end( ',
      ], 'check steps execution order');

      done();
    });
  });

  it('should execute with async/await. Await is second in order', (done) => {
    exec(`${codecept_run} --debug`, (_err, stdout) => {
      const lines = stdout.match(/\S.+/g);

      const withGeneratorList = grepLines(lines, 'Check within with async/await. Await is second in order', '-- FAILURES:');
      testStatus = withGeneratorList.pop();
      testStatus.should.include('OK');
      withGeneratorList.toEqual([
        'I small promise ',
        'I small  Promise was finished ',
        'I small yield ',
        'I am small yield string await',
        'I  Hey!  I am within  Begin.  I get blabla ',
        'Within "blabla" ',
        'I small promise ',
        'I small  Promise was finished ',
        'I small yield ',
        'I am small yield string await',
        'I oh!  I am within end( ',
      ], 'check steps execution order');

      done();
    });
  });
});
