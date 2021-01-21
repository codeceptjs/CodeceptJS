const fs = require('fs');
const { print } = require('codeceptjs/lib/output');
let optionsForCheck;

class FailedTestsRerun {

  /**
   * Sets The Options When The Run is Initiated
   * @param options
   */
  setOptions(options) {
    optionsForCheck = options;
  }

  /**
   * Initial Check To Find the Existence Of Failed Cases JSON File
   * and Content
   * @param options
   */
  checkForFailedTestsExist(options) {
    if (options.failed) {
      if (!fs.existsSync('failedCases.json')) {
        print('There Are No Failed Tests In Previous Execution');
        process.exit()
      }
      else{
        const failedTests = this.getFailedTestContent();
        if (failedTests.length === 0 || failedTests.toString() === '') {
          print('There Are No Files Present In the Failed Cases Json File');
          process.exit();
        }
      }
    }
  }

  /**
   * Returns The Content In JSON File For File/Content existence Check
   * @return {string[]}
   */
  getFailedTestContent(){
    return fs.readFileSync('failedCases.json', {encoding: 'utf8'}).split(',');
  }

  /**
   * Returns The Failed Tests
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
    fs.writeFile('failedCases.json', JSON.stringify(failedTests),function (err) {
      if (err)
        return print(err);
    });
  }

  /**
   * Removes The Passed Test From The Failed Cases JSON During the Execution
   * Deletes the File When All Tests Are Passed
   * @param passedTest
   */
  removePassedTests(passedTest) {
    if (optionsForCheck.failed ) {
      let currentFile = JSON.parse(fs.readFileSync('failedCases.json', 'utf8'));
      currentFile.forEach((t) => {
        if (currentFile.includes(passedTest)) {
          const index = currentFile.indexOf(t);
          if (index > -1) {
            currentFile.splice(index, 1);
          }
        }
      });
      if(currentFile.length === 0 ){
        fs.unlink('failedCases.json',err => {
          if(err) throw err;
        });
      }
      else{
        fs.writeFile('failedCases.json', currentFile, function (err) {
          if (err) throw err
        });
      }
    }
  }
}

module.exports = FailedTestsRerun;
