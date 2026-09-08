import Helper from 'codeceptjs/lib/helper'

export default class FakeHelper extends Helper {
  doThing(label) {
    return label
  }

  failNow(message) {
    throw new Error(message)
  }
}
