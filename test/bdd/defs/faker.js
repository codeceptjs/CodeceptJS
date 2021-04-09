const assert = require('assert');

const fields = {};

Given('I sold the {string} car to {string} for {string}', (product, customer, price) => {
  assert.notStrictEqual(fields.product, '{{vehicle.vehicle}}');
  assert.notStrictEqual(fields.customer, 'Dr. {{name.findName}}');
  assert.notStrictEqual(fields.price, '{{commerce.price}}');
  Object.assign(fields, { product, customer, price });
});

When('customer {string} paid {string} for car {string} in {string}', (customer, price, product, cashier) => {
  assert.strictEqual(fields.customer, customer);
  assert.strictEqual(fields.price, price);
  assert.strictEqual(fields.product, product);
  Object.assign(fields, { cashier });
});

Then('{string} returned {string} in change to {string}', (cashier, change, customer) => {
  assert.strictEqual(fields.cashier, cashier);
  assert.strictEqual(fields.customer, customer);
});
