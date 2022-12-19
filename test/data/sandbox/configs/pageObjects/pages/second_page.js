const assert = require('assert');

module.exports = {
  locator: 'body',
  secondPageMethod() {
    console.log('secondPageMethod');
  },
  async assertLocator() {
    await assert.toEqual(this.locator, 'body');
  },
};
