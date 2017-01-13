'use strict';
let should = require('chai').should();
let assert = require('assert');
let path = require('path');
const exec = require('child_process').exec;
let runner = path.join(__dirname, '/../../bin/codecept.js');
let codecept_dir = path.join(__dirname, '/../data/sandbox')
let codecept_run = runner +' run '+codecept_dir + ' ';

describe('list/def commands', () => {

  it('list should print actions', (done) => {
    exec(`${runner} list ${codecept_dir}`, (err, stdout, stderr) => {
      console.log(stdout);
      stdout.should.include('FileSystem'); // helper name
      stdout.should.include('FileSystem I.amInPath(openPath)'); // action name
      stdout.should.include('FileSystem I.seeFile(name)');
      assert(!err);
      done();
    });
  });


  it('def should create definition file', (done) => {
    try {
      require('fs').unlinkSync(codecept_dir + '/steps.d.ts');
    } catch (e) {}
    exec(`${runner} def ${codecept_dir}`, (err, stdout, stderr) => {
      stdout.should.include('Definitions were generated in steps.d.ts');
      stdout.should.include('<reference path="./steps.d.ts" />');
      require('fs').existsSync(codecept_dir + '/steps.d.ts').should.be.ok;
      assert(!err);
      done();
    });
  });

});