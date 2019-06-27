Feature('Mocking');

Scenario('change statusCode @Puppeteer', (I) => {
  I.amOnPage('/form/fetch_call');
  I.click('GET POSTS');
  I.startMocking();
  I.mock('GET', 'https://jsonplaceholder.typicode.com/*', 404);
  I.click('GET POSTS');
  I.see('Can not load data!');
});

Scenario('change statusCode @Puppeteer', (I) => {
  I.amOnPage('/form/fetch_call');
  I.click('GET COMMENTS');
  I.startMocking();
  I.mock('GET', 'https://jsonplaceholder.typicode.com/*', {
    modified: 'This is modified from mocking',
  });
  I.click('GET COMMENTS');
  I.see('This is modified from mocking', '#data');
});

Scenario('change statusCode for multiple requests @Puppeteer', (I) => {
  I.amOnPage('/form/fetch_call');
  I.click('GET POSTS');
  I.startMocking();
  I.mock(
    'GET',
    [
      'https://jsonplaceholder.typicode.com/posts/*',
      'https://jsonplaceholder.typicode.com/comments/*',
      'https://jsonplaceholder.typicode.com/users/*',
    ],
    {
      modified: 'MY CUSTOM DATA',
    },
  );
  I.click('GET POSTS');
  I.see('MY CUSTOM DATA', '#data');
  I.click('GET COMMENTS');
  I.see('MY CUSTOM DATA', '#data');
  I.click('GET USERS');
  I.see('MY CUSTOM DATA', '#data');
});
