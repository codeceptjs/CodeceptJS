Feature('Dynamic Config').config({ url: 'https://google.com' });

Scenario('change config 1 @WebDriverIO @Puppeteer @Playwright @Protractor @Nightmare', (I) => {
  I.amOnPage('/');
  I.dontSeeInCurrentUrl('github.com');
  I.seeInCurrentUrl('google.com');
});

Scenario('change config 2 @WebDriverIO @Puppeteer @Playwright @Protractor @Nightmare', (I) => {
  I.amOnPage('/');
  I.seeInCurrentUrl('github.com');
}).config({ url: 'https://github.com' });

Scenario('change config 3 @WebDriverIO @Puppeteer @Playwright @Protractor @Nightmare', (I) => {
  I.amOnPage('/');
  I.dontSeeInCurrentUrl('github.com');
  I.seeInCurrentUrl('google.com');
});

Scenario('change config 4 @WebDriverIO @Puppeteer @Playwright @Protractor @Nightmare', (I) => {
  I.amOnPage('/');
  I.seeInCurrentUrl('codecept.io');
}).config((test) => {
  return { url: 'https://codecept.io/', capabilities: { 'moz:title': test.title } };
});

Scenario('change config 5 @WebDriverIO @Puppeteer @Playwright @Protractor @Nightmare', (I) => {
  I.amOnPage('/');
  I.dontSeeInCurrentUrl('github.com');
  I.seeInCurrentUrl('google.com');
});

Scenario('change config 6 @WebDriverIO @Puppeteer @Playwright @Protractor @Nightmare', (I) => {
  I.amOnPage('/');
  I.seeInCurrentUrl('github.com');
}).config(async (test) => {
  await new Promise(r => setTimeout(r, 50));
  return { url: 'https://github.com' };
});

const assert = require('assert');

let container;
try {
  container = require('../codecept/lib/container'); // Tests started over docker-compose (e.g. WebDriver)
} catch (error) {
  container = require('../../lib/container'); // Tests started in non-docker env (e.g. Playwright)
}
const webDriver = container.helpers('WebDriver');

Scenario('Check custom waitForTimeout @WebDriverIO', () => {
  assert.strictEqual(webDriver.options.waitForTimeout, 15);
}).config({ waitForTimeout: 15000 });

Scenario('Check default waitForTimeout @WebDriverIO', () => {
  assert.strictEqual(webDriver.options.waitForTimeout, 1); // Check that previous scenario reset the timeout when finished
});

Scenario('Check that default waitForTimeout is still set @WebDriverIO', () => {
  assert.strictEqual(webDriver.options.waitForTimeout, 1);
});
