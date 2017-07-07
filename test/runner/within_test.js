'use strict';
let should = require('chai').should();
let assert = require('assert');
let path = require('path');
const exec = require('child_process').exec;
let runner = path.join(__dirname, '/../../bin/codecept.js');
let codecept_dir = path.join(__dirname, '/../data/sandbox')
let codecept_run = runner +' run --config '+codecept_dir + '/codecept.within.json ';
let fs;

describe('CodeceptJS Multiple Runner', function () {

  this.timeout(40000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox');
  });

  it('should execute one suite with browser', (done) => {
    exec(codecept_run+ ' --steps', (err, stdout, stderr) => {
      let lines = stdout.match(/\S.+/g);
      let testStatus;
      let getlines = function (array, startString, endString) {
        let startIndex, endIndex;
        array.every(function (elem, index) {
          if (elem === startString) {
            startIndex = index;
            return true;
          }
          if (elem === endString) {
            endIndex = index;
            return false;
          }
          return true;
        })
        return array.slice(startIndex + 1, endIndex);
      }

      let withoutGeneratorList = getlines(lines, 'Check within without generator', 'Check within with generator. Yield is first in order');
      testStatus = withoutGeneratorList.pop();
      testStatus.should.include('OK');
      withoutGeneratorList.should.eql([
        '• I small promise ',
        '• small Promise was finished',
        'Within blabla:',
        '• Hey! I am within Begin. I get blabla',
        '• Within blabla: I small promise ',
        '• small Promise was finished',
        '• oh! I am within end('
      ], 'check steps execution order');

      let withGeneratorList = getlines(lines, 'Check within with generator. Yield is first in order', 'Check within with generator. Yield is second in order');
      testStatus = withGeneratorList.pop();
      testStatus.should.include('OK');
      withGeneratorList.should.eql([
        "• I small promise ",
        "• small Promise was finished",
        "• I small yield ",
        "I am small yield string",
        "Within blabla:",
        "• Hey! I am within Begin. I get blabla",
        "• Within blabla: I small yield ",
        "I am small yield string",
        "• Within blabla: I small promise ",
        "• small Promise was finished",
        "• oh! I am within end("
      ], 'check steps execution order');

      let withGeneratorListOtherOrder = getlines(lines, 'Check within with generator. Yield is second in order', 'Check within with generator. Should complete test after within');
      testStatus = withGeneratorListOtherOrder.pop();
      testStatus.should.include('OK');
      withGeneratorListOtherOrder.should.eql([
        "• I small promise ",
        "• small Promise was finished",
        "• I small yield ",
        "I am small yield string",
        "Within blabla:",
        "• Hey! I am within Begin. I get blabla",
        "• Within blabla: I small promise ",
        "• small Promise was finished",
        "• Within blabla: I small yield ",
        "I am small yield string",
        "• oh! I am within end("
      ], 'check steps execution order');

      let withGeneratorListWithContinued = getlines(lines, 'Check within with generator. Should complete test after within', 'Check within with generator. Should stop test execution after fail in within');
      testStatus = withGeneratorListWithContinued.pop();
      testStatus.should.include('OK');
      withGeneratorListWithContinued.should.eql([
        "• I small yield ",
        "I am small yield string",
        "Within blabla:",
        "• Hey! I am within Begin. I get blabla",
        "• Within blabla: I small yield ",
        "I am small yield string",
        "• Within blabla: I small promise ",
        "• small Promise was finished",
        "• oh! I am within end(",
        "• I small promise ",
        "• small Promise was finished"
      ], 'check steps execution order');

      let errorInWithinList = getlines(lines, 'Check within with generator. Should stop test execution after fail in within', 'Check within with generator. Should stop test execution after fail in main block');
      testStatus = errorInWithinList.pop();
      testStatus.should.include('FAILED');
      errorInWithinList.should.eql([
        "• I small yield ",
        "I am small yield string",
        "Within blabla:",
        "• Hey! I am within Begin. I get blabla",
        "• Within blabla: I error step ",
        "• oh! I am within end("
      ], 'check steps execution order');

      let errorInTestList = getlines(lines, 'Check within with generator. Should stop test execution after fail in main block', '-- FAILURES:');
      testStatus = errorInTestList.pop();
      testStatus.should.include('FAILED');
      errorInTestList.should.eql([
        "• I error step ",
        "• oh! I am within end("
      ], 'check steps execution order');

      stdout.should.include(' FAIL  | 4 passed, 2 failed');

      done();
    });
  });
});
