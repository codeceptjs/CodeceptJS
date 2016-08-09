'use strict';
let Helper = require('../helper');
let fileExists = require('../utils').fileExists;
let fileIncludes = require('../assert/include').fileIncludes;
let fileEquals = require('../assert/equal').fileEquals;
let assert = require('assert');
let path = require('path');
let fs = require('fs');

/**
 * Helper for testing filesystem.
 * Can be easily used to check file structures:
 *
 * ```js
 * I.amInPath('test');
 * I.seeFile('codecept.json');
 * I.seeInThisFile('FileSystem');
 * I.dontSeeInThisFile("WebDriverIO");
 * ```
 */
class FileSystem extends Helper {

  _before() {
    this.dir = global.codecept_dir;
    this.file = null;
    this.debugSection('Dir', this.dir);
  }

  /**
   * Enters a directory In local filesystem.
   * Starts from a current directory
   */
  amInPath(openPath) {
    this.dir = path.join(global.codecept_dir, openPath);
    this.debugSection('Dir', this.dir);
  }

  /**
   * Writes test to file
   */
  writeToFile(name, text) {
    fs.writeFileSync(path.join(this.dir, name), text);
  }

  /**
   * Checks that file exists
   */
  seeFile(name) {
    this.file = path.join(this.dir, name);
    this.debugSection('File', this.file);
    assert.ok(fileExists(this.file), `File ${name} not found in ${this.dir}`);
  }

  /**
   * Checks that file found by `seeFile` includes a text.
   */
  seeInThisFile(text, encoding) {
    let content = getFileContents(this.file, encoding);
    fileIncludes(this.file).assert(text, content);
  }

  /**
   * Checks that file found by `seeFile` doesn't include text.
   */
  dontSeeInThisFile(text, encoding) {
    let content = getFileContents(this.file, encoding);
    fileIncludes(this.file).negate(text, content);
  }

  /**
   * Checks that contents of file found by `seeFile` equal to text.
   */
  seeFileContentsEqual(text, encoding) {
    let content = getFileContents(this.file, encoding);
    fileEquals(this.file).assert(text, content);
  }

  /**
   * Checks that contents of file found by `seeFile` doesn't equal to text.
   */
  dontSeeFileContentsEqual(text, encoding) {
    let content = getFileContents(this.file, encoding);
    fileEquals(this.file).negate(text, content);
  }

}

function getFileContents(file, encoding) {
  if (!file) assert.fail(`No files were opened, please use seeFile action`);
  encoding = encoding || 'utf8';
  return fs.readFileSync(file, 'utf8');

}

module.exports = FileSystem;
