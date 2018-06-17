const I = actor();

Given(/I have product with \$(\d+) price/, (price) => {
  I.addItem(parseInt(price, 10));
});
When('I go to checkout process', () => {
  I.checkout();
  I.checkout();
});

Then('I should see that total number of products is {int}', (num) => {
  I.seeNum(num);
});
Then('my order amount is ${int}', (sum) => { // eslint-disable-line
  I.seeSum(sum);
});

Given('I have product with price {int}$ in my cart', (price) => {
  I.addItem(parseInt(price, 10));
});

Given('discount for orders greater than ${int} is {int} %', (maxPrice, discount) => { // eslint-disable-line
  I.haveDiscountForPrice(maxPrice, discount);
});

When('I go to checkout', () => {
  I.checkout();
});

Then('I should see overall price is "{float}" $', (price) => {
  I.seeSum(price);
});
