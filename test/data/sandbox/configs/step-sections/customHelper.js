import Helper from '../../../../../lib/helper.js'

class CustomHelper extends Helper {
  act() {
    this.debug(JSON.stringify(arguments))
  }
}

export default CustomHelper
