const chai = require('chai');

const expect = chai.expect;

Feature('Dynamic Config').config({ url: 'https://google.com' });

Scenario('change config 1 @WebDriverIO @Puppeteer @Protractor @Nightmare', (I) => {
  I.amOnPage('/');
  I.dontSeeInCurrentUrl('github.com');
  I.seeInCurrentUrl('google.com');
});

Scenario('change config 2 @WebDriverIO @Puppeteer @Protractor @Nightmare', (I) => {
  I.amOnPage('/');
  I.seeInCurrentUrl('github.com');
}).config({ url: 'https://github.com' });

Scenario('change config 3 @WebDriverIO @Puppeteer @Protractor @Nightmare', (I) => {
  I.amOnPage('/');
  I.dontSeeInCurrentUrl('github.com');
  I.seeInCurrentUrl('google.com');
});

Scenario('change config 4 @WebDriverIO @Puppeteer @Protractor @Nightmare', (I) => {
  I.amOnPage('/');
  pause();
  I.seeInCurrentUrl('codecept.io');
}).config((test) => {
  return { url: 'https://codecept.io/', desiredCapabilities: { title: test.title } };
});


Scenario('change config 5 @WebDriverIO @Puppeteer @Protractor @Nightmare', (I) => {
  I.amOnPage('/');
  I.dontSeeInCurrentUrl('github.com');
  I.seeInCurrentUrl('google.com');
});
