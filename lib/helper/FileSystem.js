const assert = require('assert');
const path = require('path');
const fs = require('fs');

const Helper = require('../helper');
const { fileExists } = require('../utils');
const { fileIncludes } = require('../assert/include');
const { fileEquals } = require('../assert/equal');

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
 *
 * ## Methods
 */
class FileSystem extends Helper {
  constructor() {
    super();
    this.dir = global.codecept_dir;
    this.file = '';
  }

  _before() {
    this.debugSection('Dir', this.dir);
  }

  /**
   * Enters a directory In local filesystem.
   * Starts from a current directory
   * @param {string} openPath
   */
  amInPath(openPath) {
    this.dir = path.join(global.codecept_dir, openPath);
    this.debugSection('Dir', this.dir);
  }

  /**
   * Writes test to file
   * @param {string} name
   * @param {string} text
   */
  writeToFile(name, text) {
    fs.writeFileSync(path.join(this.dir, name), text);
  }

  /**
   * Checks that file exists
   * @param {string} name
   */
  seeFile(name) {
    this.file = path.join(this.dir, name);
    this.debugSection('File', this.file);
    assert.ok(fileExists(this.file), `File ${name} not found in ${this.dir}`);
  }

  /**
   * Waits for file to be present in current directory.
   *
   * ```js
   * I.handleDownloads();
   * I.click('Download large File');
   * I.amInPath('output/downloads');
   * I.waitForFile('largeFilesName.txt', 10); // wait 10 seconds for file
   * ```
   * @param {string} name
   * @param {number} [sec=1] seconds to wait
   */
  async waitForFile(name, sec = 1) {
    if (sec === 0) assert.fail('Use `seeFile` instead of waiting 0 seconds!');
    const waitTimeout = sec * 1000;
    this.file = path.join(this.dir, name);
    this.debugSection('File', this.file);
    return isFileExists(this.file, waitTimeout).catch(() => {
      throw new Error(`file (${name}) still not present in directory ${this.dir} after ${waitTimeout / 1000} sec`);
    });
  }

  /**
  * Checks that file with a name including given text exists in the current directory.
  *
  *```js
  * I.handleDownloads();
  * I.click('Download as PDF');
  * I.amInPath('output/downloads');
  * I.seeFileNameMatching('.pdf');
  * ```
  * @param {string} text
  */
  seeFileNameMatching(text) {
    assert.ok(
      this.grabFileNames().some(file => file.includes(text)),
      `File name which contains ${text} not found in ${this.dir}`,
    );
  }

  /**
   * Checks that file found by `seeFile` includes a text.
   * @param {string} text
   * @param {string} [encoding='utf8']
   */
  seeInThisFile(text, encoding = 'utf8') {
    const content = getFileContents(this.file, encoding);
    fileIncludes(this.file).assert(text, content);
  }

  /**
   * Checks that file found by `seeFile` doesn't include text.
   * @param {string} text
   * @param {string} [encoding='utf8']
   */
  dontSeeInThisFile(text, encoding = 'utf8') {
    const content = getFileContents(this.file, encoding);
    fileIncludes(this.file).negate(text, content);
  }

  /**
   * Checks that contents of file found by `seeFile` equal to text.
   * @param {string} text
   * @param {string} [encoding='utf8']
   */
  seeFileContentsEqual(text, encoding = 'utf8') {
    const content = getFileContents(this.file, encoding);
    fileEquals(this.file).assert(text, content);
  }

  /**
   * Checks that contents of the file found by `seeFile` equal to contents of the file at `pathToReferenceFile`.
   * @param {string} pathToReferenceFile
   * @param {string} [encoding='utf8']
   * @param {string} [encodingReference='utf8']
   */
  seeFileContentsEqualReferenceFile(pathToReferenceFile, encoding = 'utf8', encodingReference = '') {
    const content = getFileContents(this.file, encoding);
    assert.ok(fileExists(pathToReferenceFile), `Reference file ${pathToReferenceFile} not found.`);
    encodingReference = encodingReference || encoding;
    const expectedContent = getFileContents(pathToReferenceFile, encodingReference);
    fileEquals(this.file).assert(expectedContent, content);
  }

  /**
   * Checks that contents of file found by `seeFile` doesn't equal to text.
   * @param {string} text
   * @param {string} [encoding='utf8']
   */
  dontSeeFileContentsEqual(text, encoding = 'utf8') {
    const content = getFileContents(this.file, encoding);
    fileEquals(this.file).negate(text, content);
  }

  /**
  * Returns file names in current directory.
  *
  * ```js
  * I.handleDownloads();
  * I.click('Download Files');
  * I.amInPath('output/downloads');
  * const downloadedFileNames = I.grabFileNames();
  * ```
  */
  grabFileNames() {
    return fs.readdirSync(this.dir)
      .filter(item => !fs.lstatSync(path.join(this.dir, item)).isDirectory());
  }
}

module.exports = FileSystem;

/**
 * @param {string} file
 * @param {string} [encoding='utf8']
 * @private
 * @returns {string}
 */
function getFileContents(file, encoding = 'utf8') {
  if (!file) assert.fail('No files were opened, please use seeFile action');
  if (encoding === '') assert.fail('Encoding is an empty string, please set a valid encoding');
  return fs.readFileSync(file, encoding);
}

/**
 * @param {string} file
 * @param {number} timeout
 * @private
 * @returns {Promise<any>}
 */
function isFileExists(file, timeout) {
  return new Promise(((resolve, reject) => {
    const timer = setTimeout(() => {
      watcher.close();
      reject(new Error('File did not exists and was not created during the timeout.'));
    }, timeout);

    const dir = path.dirname(file);
    const basename = path.basename(file);
    const watcher = fs.watch(dir, (eventType, filename) => {
      if (eventType === 'rename' && filename === basename) {
        clearTimeout(timer);
        watcher.close();
        resolve();
      }
    });

    fs.access(file, fs.constants.R_OK, (err) => {
      if (!err) {
        clearTimeout(timer);
        watcher.close();
        resolve();
      }
    });
  }));
}
