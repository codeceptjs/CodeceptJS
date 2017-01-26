'use strict';
let should = require('chai').should();
let assert = require('assert');
let path = require('path');
const exec = require('child_process').exec;
let runner = path.join(__dirname, '/../../bin/codecept.js');
let codecept_dir = path.join(__dirname, '/../data/sandbox')
let codecept_run = runner +' run '+codecept_dir + ' ';
let config_run_config = (config) => `${codecept_run} --config ${config}`;
let config_run_override = (config) => `${codecept_run} --override '${JSON.stringify(config)}'`;
let fs;

describe('CodeceptJS Interface', () => {

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox');
  });

  it('should rerun flacky tests', (done) => {
    exec(config_run_config('codecept.flacky.json'), (err, stdout, stderr) => {
      stdout.should.include('Flacky'); // feature
      stdout.should.include('Not so flacky test'); // test name
      assert(!err);
      done();
    });
  });

  it('should execute expected promise chain', (done) => {
    exec(codecept_run + ' --verbose', (err, stdout, stderr) => {
      var queue1 = stdout.match(/\[1\] .+/g);
      queue1.should.eql([
        "[1] Starting recording promises",
        "[1] Queued | hook FileSystem._beforeSuite()"
      ]);

      var queue2 = stdout.match(/\[2\] .+/g);
      queue2.should.eql([
        `[2] Starting recording promises`,
        `[2] Queued | hook FileSystem._before()`,
        `[2] Queued | amInPath: "."`,
        `[2] Queued | return step result`,
        `[2] Queued | say hello world`,
        `[2] Queued | seeFile: "codecept.json"`,
        `[2] Queued | return step result`,
        `[2] Queued | fire test.passed`,
        `[2] Queued | finish test`,
        `[2] Queued | hook FileSystem._after()`
      ]);

      var queue3 = stdout.match(/\[3\] .+/g);
      queue3.should.eql([
        `[3] Starting recording promises`,
        `[3] Queued | hook FileSystem._afterSuite()`
      ]);

      let lines = stdout.match(/\S.+/g);

      // before hooks
      let beforeStep = [
        `Emitted | step.before (I am in path ".")`,
        `[2] Queued | amInPath: "."`,
        `Emitted | step.after (I am in path ".")`,
        `Emitted | step.start (I am in path ".")`,
        `• I am in path "."`
      ];

      lines.filter((l) => beforeStep.indexOf(l) > -1)
        .should.eql(beforeStep, 'check step hooks execution order');

      // steps order
      let step = [
        `• I am in path "."`,
        `hello world`,
        `• I see file "codecept.json"`
      ];

      lines.filter((l) => step.indexOf(l) > -1)
        .should.eql(step, 'check steps execution order');

      assert(!err);
      done();
    });
  });

});