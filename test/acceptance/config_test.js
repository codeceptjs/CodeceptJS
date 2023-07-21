Feature('Dynamic Config').config({ url: 'https://google.com' });

Scenario('change config 1 @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/');
  I.dontSeeInCurrentUrl('github.com');
  I.seeInCurrentUrl('google.com');
});

Scenario('change config 2 @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/');
  I.seeInCurrentUrl('github.com');
}).config({ url: 'https://github.com' });

Scenario('change config 3 @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/');
  I.dontSeeInCurrentUrl('github.com');
  I.seeInCurrentUrl('google.com');
});

Scenario('change config 4 @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/');
  I.seeInCurrentUrl('codecept.io');
}).config((test) => {
  return { url: 'https://codecept.io/', capabilities: { 'moz:title': test.title } };
});

Scenario('change config 5 @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/');
  I.dontSeeInCurrentUrl('github.com');
  I.seeInCurrentUrl('google.com');
});

Scenario('make API call and check response @Playwright', ({ I }) => {
  I.amOnPage('/');
  I.makeApiRequest('get', 'https://reqres.in/api/users?page=2');
  I.seeResponseCodeIsSuccessful();
});

Scenario('change config 6 @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/');
  I.seeInCurrentUrl('github.com');
}).config(async () => {
  await new Promise(r => setTimeout(r, 50));
  return { url: 'https://github.com' };
});
