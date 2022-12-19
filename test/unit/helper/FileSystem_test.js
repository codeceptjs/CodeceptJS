const path = require('path');
const expect = require('expect');

const FileSystem = require('../../../lib/helper/FileSystem');

global.codeceptjs = require('../../../lib');

let fs;

describe('FileSystem', () => {
  before(() => {
    global.codecept_dir = path.join(__dirname, '/../..');
  });

  beforeEach(() => {
    fs = new FileSystem();
    fs._before();
  });

  it('should be initialized before tests', () => {
    expect(fs.dir).toEqual(global.codecept_dir);
  });

  it('should open dirs', () => {
    fs.amInPath('data');
    expect(fs.dir).toEqual(path.join(global.codecept_dir, '/data'));
  });

  it('should see file', () => {
    fs.seeFile('data/fs_sample.txt');
    fs.amInPath('data');
    fs.seeFile('fs_sample.txt');
    expect(fs.grabFileNames()).toContain('fs_sample.txt');
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
});
