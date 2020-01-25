const assert = require('assert');
const path = require('path');
const fs = require('fs');

const Helper = require('../helper');
const fileExists = require('../utils').fileExists;
const fileIncludes = require('../assert/include').fileIncludes;
const fileEquals = require('../assert/equal').fileEquals;

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
   * I.waitForFile('largeFilesName.txt');
   * ```
   * @param {string} name
   * @param {?number} [sec=1] seconds to wait
   */
  async waitForFile(name, sec = 1) {
    const timeout = sec ? sec * 1000 : 1000;
    this.file = path.join(this.dir, name);
    this.debugSection('File', this.file);
    await checkExistsWithTimeout(this.file, timeout);
    assert.ok(fileExists(this.file), `File ${name} not found in ${this.dir}`);
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
   * @param {?string} [encoding='utf8'] (optional, `utf8` by default)
   */
  seeInThisFile(text, encoding = 'utf8') {
    const content = getFileContents(this.file, encoding);
    fileIncludes(this.file).assert(text, content);
  }

  /**
   * Checks that file found by `seeFile` doesn't include text.
   * @param {string} text
   * @param {?string} [encoding='utf8'] (optional, `utf8` by default)
   */
  dontSeeInThisFile(text, encoding = 'utf8') {
    const content = getFileContents(this.file, encoding);
    fileIncludes(this.file).negate(text, content);
  }

  /**
   * Checks that contents of file found by `seeFile` equal to text.
   * @param {string} text
   * @param {?string} [encoding='utf8'] (optional, `utf8` by default)
   */
  seeFileContentsEqual(text, encoding = 'utf8') {
    const content = getFileContents(this.file, encoding);
    fileEquals(this.file).assert(text, content);
  }

  /**
   * Checks that contents of the file found by `seeFile` equal to contents of the file at `pathToReferenceFile`.
   * @param {string} pathToReferenceFile
   * @param {?string} [encoding='utf8'] (optional, `utf8` by default)
   * @param {?string} [encodingReference='utf8'] (optional, `utf8` by default)
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
   * @param {?string} [encoding='utf8'] (optional, `utf8` by default)
   */
  dontSeeFileContentsEqual(text, encoding) {
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

function getFileContents(file, encoding) {
  if (!file) assert.fail('No files were opened, please use seeFile action');
  encoding = encoding || 'utf8';
  return fs.readFileSync(file, encoding);
}

module.exports = FileSystem;

function checkExistsWithTimeout(filePath, timeout) {
  return new Promise(((resolve, reject) => {
    const timer = setTimeout(() => {
      watcher.close();
      reject(new Error('File did not exists and was not created during the timeout.'));
    }, timeout);

    const dir = path.dirname(filePath);
    const basename = path.basename(filePath);
    const watcher = fs.watch(dir, (eventType, filename) => {
      if (eventType === 'rename' && filename === basename) {
        clearTimeout(timer);
        watcher.close();
        resolve();
      }
    });

    fs.access(filePath, fs.constants.R_OK, (err) => {
      if (!err) {
        clearTimeout(timer);
        watcher.close();
        resolve();
      }
    });
  }));
}
