Feature('Mocking');

Scenario('mock requests @Puppeteer', (I) => {
  I.amOnPage('/form/fetch_call');
  I.click('GET DATA');
  I.startMocking();
  I.mock('GET', 'https://jsonplaceholder.typicode.com/*', 404);
  I.click('GET DATA');
  I.mock('GET', 'https://jsonplaceholder.typicode.com/*', {
    custom: 'MY DATA',
  });
  I.click('GET DATA');
});
