import Helper from '../../../../../lib/helper.js'

class CustomHelper extends Helper {
  shouldDoSomething(s) {}

  fail() {
    throw new Error('Failed from helper')
  }
}

export default CustomHelper
