const assert = require('assert')
const Helper = require('../../../../lib/helper')

class CheckoutHelper extends Helper {
  constructor(config) {
    super(config)
    console.log('DEBUG: CheckoutHelper constructor called')
  }

  _init() {
    console.log('DEBUG: CheckoutHelper._init called')
  }

  _before() {
    this.num = 0
    this.sum = 0
    this.discountCalc = null
  }

  addItem(price) {
    this.num++
    this.sum += price
  }

  seeNum(num) {
    assert.equal(num, this.num)
  }

  seeSum(sum) {
    assert.equal(sum, this.sum)
  }

  haveDiscountForPrice(price, discount) {
    this.discountCalc = () => {
      if (this.sum > price) {
        this.sum -= (this.sum * discount) / 100
      }
    }
  }

  addProduct(name, price) {
    this.sum += price
  }

  checkout() {
    if (this.discountCalc) {
      this.discountCalc()
    }
  }

  login() {}

  say(message) {
    // Use CodeceptJS output system instead of direct console.log
    const output = require('../../../../lib/output')
    output.log(`[Helper] ${message}`)
  }

  debug(message) {
    // Use CodeceptJS output system instead of direct console.log
    const output = require('../../../../lib/output')
    output.debug(`[Helper] ${message}`)
  }
}

module.exports = CheckoutHelper
