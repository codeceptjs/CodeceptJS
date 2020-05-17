Feature('Checkout');

Before(({ I }) => {
  I.amOnPage('https://getbootstrap.com/docs/4.0/examples/checkout/');
});


Scenario('It should fill in checkout page', ({ I }) => {
  I.fillField('#lastName', 'mik');
  I.fillField('Promo code', '123345');
  I.click('Redeem');
  I.click(locate('h6').withText('Third item'));
  I.checkOption('#same-address');
  I.see('Paymen1t');
  I.click('Paypal');
  I.click('Checkout');
  I.see('Thank you!');
});
