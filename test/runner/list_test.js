const fs = require('fs');
const assert = require('assert');
const path = require('path');
const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox');

describe('list/def commands', () => {
  it('list should print actions', (done) => {
    exec(`${runner} list ${codecept_dir}`, (err, stdout, stderr) => {
      stdout.should.include('FileSystem'); // helper name
      stdout.should.include('FileSystem I.amInPath(openPath)'); // action name
      stdout.should.include('FileSystem I.seeFile(name)');
      assert(!err);
      done();
    });
  });

  it('def should create definition file', (done) => {
    try {
      fs.unlinkSync(`${codecept_dir}/steps.d.ts`);
    } catch (e) {
      // continue regardless of error
    }
    exec(`${runner} def ${codecept_dir}`, (err, stdout, stderr) => {
      stdout.should.include('Definitions were generated in steps.d.ts');
      fs.existsSync(`${codecept_dir}/steps.d.ts`).should.be.ok;
      const def = fs.readFileSync(`${codecept_dir}/steps.d.ts`).toString();
      def.should.include('amInPath(openPath: string) : void');
      def.should.include('    seeFile(name: string) : void');
      assert(!err);
      done();
    });
  });

  it('def should create definition file given a config file', (done) => {
    try {
      fs.unlinkSync(`${codecept_dir}/steps.d.ts`);
    } catch (e) {
      // continue regardless of error
    }
    exec(`${runner} def --config ${codecept_dir}/codecept.ddt.json`, (err, stdout, stderr) => {
      stdout.should.include('Definitions were generated in steps.d.ts');
      fs.existsSync(`${codecept_dir}/steps.d.ts`).should.be.ok;
      assert(!err);
      done();
    });
  });

  it('def should create definition file with support object', (done) => {
    try {
      fs.unlinkSync(`${codecept_dir}/steps.d.ts`);
    } catch (e) {
      // continue regardless of error
    }
    exec(`${runner} def --config ${codecept_dir}/codecept.inject.po.json`, () => {
      const content = fs.readFileSync(`${codecept_dir}/steps.d.ts`).toString();
      content.should.include('    openDir() : void');
      content.should.include('  export interface MyPage {');
      content.should.include('    hasFile() : void');
      done();
    });
  });

  it('def should create definition file with internal object', (done) => {
    try {
      fs.unlinkSync(`${codecept_dir}/steps.d.ts`);
    } catch (e) {
      // continue regardless of error
    }
    exec(`${runner} def --config ${codecept_dir}/codecept.inject.po.json`, () => {
      const content = fs.readFileSync(`${codecept_dir}/steps.d.ts`).toString();
      content.should.include('  export const recorder: Recorder');
      content.should.include('  export const event: CodeceptJSEvent');
      content.should.include('  export const output: Output');
      content.should.include('  export const config: Config');
      content.should.include('  export const container: Container');
      done();
    });
  });
});
