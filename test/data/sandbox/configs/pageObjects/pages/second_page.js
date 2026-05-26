import assert from 'assert';

export default {
  locator: 'body',
  secondPageMethod() {
    console.log('secondPageMethod');
  },
  async assertLocator() {
    await assert.equal(this.locator, 'body');
  },
};
