const assert = require('assert');
const Helper = require('../../../../lib/helper');

class CheckoutHelper extends Helper {
  _init() {
    this.num = 0;
    this.sum = 0;
  }

  addItem(price) {
    this.num++;
    this.sum += price;
  }

  seeNum(num) {
    assert.equal(num, this.num);
  }
  seeSum(sum) {
    assert.equal(sum, this.sum);
  }
}

module.exports = CheckoutHelper;

