import path from 'path';

import { expect } from 'chai';

import FileSystem from '../../../lib/helper/FileSystem.js';

import lib from '../../../lib/codecept.js';

const __dirname = path.resolve('.', 'test');

global.codeceptjs = lib;

let fs;

describe('FileSystem', () => {
  before(() => {
    global.codecept_dir = path.join(__dirname);
  });

  beforeEach(() => {
    fs = new FileSystem();
    fs._before();
  });

  it('should be initialized before tests', () => {
    expect(fs.dir).to.eql(global.codecept_dir);
  });

  it('should open dirs', () => {
    fs.amInPath('data');
    expect(fs.dir).to.eql(path.join(global.codecept_dir, '/data'));
  });

  it('should see file', () => {
    fs.seeFile('data/fs_sample.txt');
    fs.amInPath('data');
    fs.seeFile('fs_sample.txt');
    expect(fs.grabFileNames()).to.include('fs_sample.txt');
    fs.seeFileNameMatching('sample');
  });

  it('should check file contents', () => {
    fs.seeFile('data/fs_sample.txt');
    fs.seeInThisFile('FileSystem');
    fs.dontSeeInThisFile('WebDriverIO');
    fs.dontSeeFileContentsEqual('123345');
    fs.seeFileContentsEqual(`A simple file
for FileSystem helper
test`);
  });

  it('should write text to file', () => {
    const outputFilePath = 'data/output/fs_output.txt';
    const text = '123';
    fs.writeToFile(outputFilePath, text);
    fs.seeFile(outputFilePath);
    fs.seeInThisFile(text);
  });
});
