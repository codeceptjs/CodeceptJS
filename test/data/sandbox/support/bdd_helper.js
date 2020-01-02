const assert = require('assert');
const Helper = require('../../../../lib/helper');

class CheckoutHelper extends Helper {
  _before() {
    this.num = 0;
    this.sum = 0;
    this.discountCalc = null;
  }

  addItem(price) {
    this.num++;
    this.sum += price;
  }

  seeNum(num) {
    assert.equal(num, this.num);
  }

  haveDiscountForPrice(price, discount) {
    this.discountCalc = () => {
      if (this.sum > price) {
        this.sum -= this.sum * discount / 100;
      }
    };
  }

  addProduct(name, price) {
    this.sum += price;
  }

  checkout() {
    if (this.discountCalc) {
      this.discountCalc();
    }
  }

  login() {}
}

module.exports = CheckoutHelper;
