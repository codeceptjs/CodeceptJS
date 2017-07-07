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

      let withGeneratorList2 = getlines(lines, 'Check within with generator. Yield is second in order', 'Check within with generator. Should complete test after within');
      testStatus = withGeneratorList2.pop();
      testStatus.should.include('OK');
      withGeneratorList2.should.eql([
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

      let withGeneratorList3 = getlines(lines, 'Check within with generator. Should complete test after within', 'Check within with generator. Should stop test execution after fail in within');
      testStatus = withGeneratorList3.pop();
      testStatus.should.include('OK');
      withGeneratorList3.should.eql([
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

      let withGeneratorList4 = getlines(lines, 'Check within with generator. Should stop test execution after fail in within', 'Check within with generator. Should stop test execution after fail in main block');
      testStatus = withGeneratorList4.pop();
      testStatus.should.include('FAILED');
      withGeneratorList4.should.eql([
        "• I small yield ",
        "I am small yield string",
        "Within blabla:",
        "• Hey! I am within Begin. I get blabla",
        "• Within blabla: I error step ",
        "• oh! I am within end("
      ], 'check steps execution order');

      let withGeneratorList5 = getlines(lines, 'Check within with generator. Should stop test execution after fail in main block', '-- FAILURES:');
      testStatus = withGeneratorList5.pop();
      testStatus.should.include('FAILED');
      withGeneratorList5.should.eql([
        "• I error step ",
        "• oh! I am within end("
      ], 'check steps execution order');

      stdout.should.include(' FAIL  | 4 passed, 2 failed');

      done();
    });
  });
});
