import Helper from '@codeceptjs/helper'

class Custom extends Helper {
  hello() {
    const { I } = inject()
  }
}

export default Custom
