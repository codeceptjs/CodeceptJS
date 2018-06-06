const I = actor();

Given(/I have product with $(\d+) price/, (price) => {
  I.addItem(parseInt(price, 10));
});
When('I go to checkout process', () => {
});

Then('I should see that total number of products is {int}', (num) => {
  I.seeNum(num);
});
Then('my order amount is ${float}', (sum) => { // eslint-disable-line
  I.seeSum(sum);
});
