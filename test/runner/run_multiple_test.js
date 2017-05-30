'use strict';
let should = require('chai').should();
let assert = require('assert');
let path = require('path');
const exec = require('child_process').exec;
let runner = path.join(__dirname, '/../../bin/codecept.js');
let codecept_dir = path.join(__dirname, '/../data/sandbox')
let codecept_run = runner +' run-multiple --config '+codecept_dir + '/codecept.multiple.json ';
let fs;

describe('CodeceptJS Multiple Runner', function() {

  this.timeout(40000);

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox');
  });

  it('should execute one suite with browser', (done) => {
    exec(codecept_run+'default:firefox', (err, stdout, stderr) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('.default:firefox] print browser ');
      stdout.should.not.include('.default:chrome] print browser ');
      assert(!err);
      done();
    });
  });

  it('should execute one suite with browser', (done) => {
    exec(codecept_run+'default:firefox', (err, stdout, stderr) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('.default:firefox] print browser ');
      stdout.should.not.include('.default:chrome] print browser ');
      assert(!err);
      done();
    });
  });

  it('should execute all suites', (done) => {
    exec(codecept_run+'--all', (err, stdout, stderr) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('[1.default:chrome] print browser ');
      stdout.should.include('[2.default:firefox] print browser ');
      stdout.should.include('[3.mobile:android] print browser ');
      stdout.should.include('[4.mobile:safari] print browser ');
      assert(!err);
      done();
    });
  });

  it('should execute multiple suites', (done) => {
    exec(codecept_run+'mobile default ', (err, stdout, stderr) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('[1.mobile:android] print browser ');
      stdout.should.include('[2.mobile:safari] print browser ');
      stdout.should.include('[3.default:chrome] print browser ');
      stdout.should.include('[4.default:firefox] print browser ');
      assert(!err);
      done();
    });
  });

  it('should print steps', (done) => {
    exec(codecept_run+'default --steps', (err, stdout, stderr) => {
      stdout.should.include('CodeceptJS'); // feature
      stdout.should.include('[2.default:firefox] print browser ');
      stdout.should.include('[2.default:firefox]  • I print browser');
      stdout.should.include('[1.default:chrome] print browser ');
      stdout.should.include('[1.default:chrome]  • I print browser');
      assert(!err);
      done();
    });
  });

});
