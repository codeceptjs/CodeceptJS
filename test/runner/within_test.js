import path from 'path';
import { exec } from 'child_process';
import { expect } from 'chai';
import { grepLines } from '../../lib/utils.js';

const __dirname = path.resolve('.');
const runner = path.join(__dirname, 'bin/codecept.js');
const codecept_dir = path.join(__dirname, 'test/data/sandbox');
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.within.json `;

let testStatus;

describe('CodeceptJS within', function () {
  this.timeout(40000);

  before(() => {
    global.codecept_dir = path.join(__dirname, 'test/data/sandbox');
  });

  it('should execute if no generators', (done) => {
    exec(`${codecept_run} --verbose`, (_err, stdout) => {
      console.log(`${codecept_run} --debug`)
      const lines = stdout.match(/\S.+/g);

      const withoutGeneratorList = grepLines(lines, 'Check within without generator', 'Check within with generator. Yield is first in order');
      testStatus = withoutGeneratorList.pop();
      expect(testStatus).to.include('OK');
      withoutGeneratorList.should.eql([
        'I small promise ',
        'I small promise was finished ',
        'I hey! i am within begin. i get blabla ',
        'Within "blabla" ""',
        'I small promise ',
        'I small promise was finished ',
        'I oh! i am within end( ',
      ], 'check steps execution order');
      done();
    });
  });

  it('should execute with async/await. Await is first in order', (done) => {
    exec(`${codecept_run} --debug`, (_err, stdout) => {
      const lines = stdout.match(/\S.+/g);

      const withGeneratorList = grepLines(lines, 'Check within with async/await. Await is first in order', 'Check within with async/await. Await is second in order');
      testStatus = withGeneratorList.pop();
      expect(testStatus).to.include('OK');
      withGeneratorList.should.eql([
        'I small promise ',
        'I small promise was finished ',
        'I small yield ',
        'I am small yield string await',
        'I hey! i am within begin. i get blabla ',
        'Within "blabla" ""',
        'I small yield ',
        'I am small yield string await',
        'I small promise ',
        'I small promise was finished ',
        'I oh! i am within end( ',
      ], 'check steps execution order');

      done();
    });
  });

  it('should execute with async/await. Await is second in order', (done) => {
    exec(`${codecept_run} --debug`, (_err, stdout) => {
      const lines = stdout.match(/\S.+/g);

      const withGeneratorList = grepLines(lines, 'Check within with async/await. Await is second in order', '-- FAILURES:');
      testStatus = withGeneratorList.pop();
      expect(testStatus).to.include('OK');
      withGeneratorList.should.eql([
        'I small promise ',
        'I small promise was finished ',
        'I small yield ',
        'I am small yield string await',
        'I hey! i am within begin. i get blabla ',
        'Within "blabla" ""',
        'I small promise ',
        'I small promise was finished ',
        'I small yield ',
        'I am small yield string await',
        'I oh! i am within end( ',
      ], 'check steps execution order');

      done();
    });
  });
});
