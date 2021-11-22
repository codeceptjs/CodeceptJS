Feature('Checkout');

Before(({ I }) => {
  I.amOnPage('https://getbootstrap.com/docs/4.0/examples/checkout/');
});

Scenario('It should fill in checkout page', async ({ I }) => {
  I.fillField('#lastName', 'mik');
  await retryTo((retryNum) => {
    // I.usePlaywrightTo('set 0', async ({ browserContext }) => {
    //   await browserContext.setDefaultTimeout(0);
    // });
    console.log('retry', retryNum);
    I.fillField('Promo code', '123345');
    I.click('Redeem');
    I.click(locate('h6').withText('Third item'));
    I.checkOption('#same-address');
    I.see('Paymen1t');
  }, 3);
  I.click('Paypal');
  I.click('Checkout');
  I.see('Thank you!');
});
