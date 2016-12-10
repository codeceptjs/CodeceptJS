'use strict';
let should = require('chai').should();
let path = require('path');
const exec = require('child_process').exec;
let runner = path.join(__dirname, '/../../bin/codecept.js');
let codecept_dir = path.join(__dirname, '/../data/sandbox')
let fs;

describe('CodeceptJS Runner', () => {

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox');
  });

  it('should be executed', (done) => {
    exec(runner +' run '+codecept_dir, (err, stdout, stderr) => {
      stdout.should.include('Filesystem'); // feature
      stdout.should.include('check current dir'); // test name
      done();
    })
  });

  xit('should return -1 on fail', () => {

  });

  xit('should run bootstrap', () => {

  });

  xit('should run teardown', () => {

  });

  xit('should be executed with config', () => {

  });

  xit('should try different configs to load', () => {

  })

});