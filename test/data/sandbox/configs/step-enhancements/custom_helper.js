const { store } = require('codeceptjs')

let retryCount = 0

class MyHelper {
  retryFewTimesAndPass(num) {
    if (retryCount < num) {
      retryCount++
      throw new Error('Failed on try ' + retryCount)
    }
  }

  wait(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout))
  }

  printOption() {
    if (store.currentStep?.opts) {
      console.log('Option:', store.currentStep?.opts?.text)
    }
  }
}

module.exports = MyHelper
