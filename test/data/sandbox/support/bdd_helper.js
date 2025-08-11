import assert from 'assert'
import helperModule from '../../../../lib/helper.js'
const Helper = helperModule.default || helperModule

class CheckoutHelper extends Helper {
  _before() {
    this.num = 0
    this.sum = 0
    this.discountCalc = null
  }

  addItem(price) {
    if (typeof this.num !== 'number') this.num = 0
    if (typeof this.sum !== 'number') this.sum = 0
    this.num++
    this.sum += price
  }

  seeNum(num) {
    if (typeof this.num !== 'number') this.num = 0
    assert.equal(num, this.num)
  }

  seeSum(sum) {
    if (typeof this.sum !== 'number') this.sum = 0
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
    if (typeof this.num !== 'number') this.num = 0
    if (typeof this.sum !== 'number') this.sum = 0
    this.num++
    this.sum += price
  }

  checkout() {
    if (this.discountCalc) {
      this.discountCalc()
    }
  }

  login() {}
}

export default CheckoutHelper
