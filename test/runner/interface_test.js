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
});