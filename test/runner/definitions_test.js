const fs = require('fs');
const assert = require('assert');
const path = require('path');
const exec = require('child_process').exec;

const runner = path.join(__dirname, '/../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/definitions');

describe('def commands', () => {
  afterEach(() => {
    try {
      fs.unlinkSync(`${codecept_dir}/steps.d.ts`);
      fs.unlinkSync(`${codecept_dir}/../../steps.d.ts`);
    } catch (e) {
      // continue regardless of error
    }
  });
  it('def should create definition file', (done) => {
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
    exec(`${runner} def --config ${codecept_dir}/../../codecept.ddt.json`, (err, stdout, stderr) => {
      stdout.should.include('Definitions were generated in steps.d.ts');
      fs.existsSync(`${codecept_dir}/../../steps.d.ts`).should.be.ok;
      assert(!err);
      done();
    });
  });

  it('def should create definition file with support object', (done) => {
    exec(`${runner} def --config ${codecept_dir}/codecept.inject.po.json`, () => {
      const content = fs.readFileSync(`${codecept_dir}/steps.d.ts`).toString();
      content.should.include('    openDir() : void');
      content.should.include('  export interface MyPage {');
      content.should.include('    hasFile() : void');
      done();
    });
  });

  it('def should create definition file with internal object', (done) => {
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

  it('def should create definition file with inject which contains support objects', (done) => {
    exec(`${runner} def --config ${codecept_dir}/codecept.inject.po.json`, () => {
      const content = fs.readFileSync(`${codecept_dir}/steps.d.ts`).toString();
      content.should.include('declare function inject(): {');
      content.should.include(' MyPage: CodeceptJS.MyPage');
      content.should.include(' SecondPage: CodeceptJS.SecondPage');
      done();
    });
  });

  it('def should create definition file with inject which contains I object', (done) => {
    exec(`${runner} def --config ${codecept_dir}/codecept.inject.po.json`, (err, stdout, stderr) => {
      assert(!err);
      const content = fs.readFileSync(`${codecept_dir}/steps.d.ts`).toString();
      content.should.include(`
declare function inject(): {
  I: CodeceptJS.I
  MyPage: CodeceptJS.MyPage`);
      done();
    });
  });

  it('def should create definition file with inject which contains I object from helpers', (done) => {
    exec(`${runner} def --config ${codecept_dir}//codecept.inject.powi.json`, () => {
      const content = fs.readFileSync(`${codecept_dir}//steps.d.ts`).toString();
      content.should.include('declare function inject(): {');
      content.should.include(' I: CodeceptJS.I');
      done();
    });
  });

  it('def should create definition file with callback params', (done) => {
    exec(`${runner} def --config ${codecept_dir}/codecept.inject.po.json`, () => {
      const content = fs.readFileSync(`${codecept_dir}/steps.d.ts`).toString();
      content.should.include('type ICodeceptCallback = (i?: CodeceptJS.I, current?:any, MyPage?:CodeceptJS.MyPage, SecondPage?:CodeceptJS.SecondPage, ...args: any) => void;');
      done();
    });
  });
});
