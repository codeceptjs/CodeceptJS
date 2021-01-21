const fs = require('fs');
const { print } = require('codeceptjs/lib/output');

class FailedTestsRerun {
  /**
   * Initial Check To Find the Existence Of Failed Cases JSON File
   * and Content
   * @param options
   */
  checkForFailedTestsExist(options) {
    if (options.rerunTests) {
      if (!fs.existsSync('failedCases.json')) {
        print('There Are No Failed Tests In Previous Execution');
        process.exit();
      } else {
        const failedTests = this.getFailedTestContent();
        if (failedTests.length === 0 || failedTests.toString() === '') {
          print('There Are No Files Present In the Failed Cases Json File');
          process.exit();
        }
      }
    }
  }

  /**
   * Checks If The Valid Files are Passed in Failed Cases Json File
   *@param testFiles
   */
  checkForFileExistence(testFiles) {
    const invalidTest = [];
    let flag = 0;
    for (let i = 0; i < testFiles.length; i++) {
      const path = testFiles[i];
      if (!fs.existsSync(path)) {
        invalidTest.push(path);
        flag++;
      }
    }
    if (flag > 0) {
      // eslint-disable-next-line no-useless-concat
      print('\nInvalid File(s) Found :' + '\n');
      for (let j = 0; j < invalidTest.length; j++) {
        print(invalidTest[j]);
      }
      process.exit();
    }
  }

  /**
   * Returns The Content In JSON File For File/Content existence Check
   * @return {string[]}
   */
  getFailedTestContent() {
    return fs.readFileSync('failedCases.json', { encoding: 'utf8' }).split(',');
  }

  /**
   * Returns The Failed/Selected Tests
   * @return {any}
   */
  getFailedTests() {
    return JSON.parse(fs.readFileSync('failedCases.json', 'utf8'));
  }

  /**
   * Writes The Failed Tests in The Failed Cases JSON File Post Execution
    * @param failedTests
   */
  writeFailedTests(failedTests) {
    if (failedTests.length > 0) {
      fs.writeFileSync('failedCases.json', JSON.stringify(failedTests), (err) => {
        if (err) { return print(err); }
      });
    }
  }

  /**
   * Removes The Passed Test From The Failed Cases JSON During the Execution
   * Deletes the File When All Tests Are Passed
   * @param passedTest
   */
  removePassedTests(passedTest) {
    if (fs.existsSync('failedCases.json')) {
      const currentFile = JSON.parse(fs.readFileSync('failedCases.json', 'utf8'));
      currentFile.forEach((t) => {
        if (currentFile.includes(passedTest)) {
          const index = currentFile.indexOf(t);
          if (index > -1) {
            currentFile.splice(index, 1);
          }
        }
      });
      fs.writeFile('failedCases.json', JSON.stringify(currentFile), (err) => {
        if (err) throw err;
      });
    }
  }

  /**
   * To Remove The Failed Cases JSON file if No Tests Are There
   * @param failedTests
   */
  checkAndRemoveFailedCasesFile(failedTests) {
    if (failedTests.length < 1) {
      if (fs.existsSync('failedCases.json')) {
        fs.unlinkSync('failedCases.json');
      }
    }
  }
}

module.exports = FailedTestsRerun;
