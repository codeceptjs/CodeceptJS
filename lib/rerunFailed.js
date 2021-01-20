const fs = require('fs');
const { print } = require('codeceptjs/lib/output');
let optionsForCheck;

class FailedTestsRerun {

  setOptions(options) {
    optionsForCheck = options;
  }

  getOptions(){
    return optionsForCheck;
  }

  checkForFailedTestsExist(options) {
    if (options.failed) {
      if (!fs.existsSync('failedCases.json')) {
        print('There Are No Failed Tests In Previous Execution');
        process.exit()
      }
      else{
        const failedTests = this.getFailedTestContent();
        if (failedTests.length === 0 || failedTests.toString() === '') {
          print('There Are No Files Present In the Failed Tests File');
          process.exit();
        }
      }
    }
  }

  getFailedTestContent(){
    return fs.readFileSync('failedCases.json', {encoding: 'utf8'}).split(',');
  }

  getFailedTests() {
    return JSON.parse(fs.readFileSync('failedCases.json', 'utf8'));
   }

  writeFailedTests(failedTests) {
    fs.writeFile('failedCases.json', JSON.stringify(failedTests),function (err) {
      if (err)
        return print(err);
    });
  }

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
