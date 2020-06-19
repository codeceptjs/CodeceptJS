Feature('Mocking');

const fetchPost = response => response.url() === 'https://jsonplaceholder.typicode.com/posts/1';

const fetchComments = response => response.url() === 'https://jsonplaceholder.typicode.com/comments/1';

const fetchUsers = response => response.url() === 'https://jsonplaceholder.typicode.com/users/1';

Scenario('change statusCode @WebDriver', (I) => {
  I.amOnPage('/form/fetch_call');
  I.mockRequest('GET', 'https://jsonplaceholder.typicode.com/*', 404);
  I.click('GET POSTS');
  I.waitForText('Can not load data!', 1, '#data');
  I.stopMocking();
});

Scenario('change response data @WebDriver', (I) => {
  I.amOnPage('/form/fetch_call');
  I.mockRequest('GET', 'https://jsonplaceholder.typicode.com/*', {
    modified: 'This is modified from mocking',
  });
  I.click('GET COMMENTS');
  I.waitForText('This is modified from mocking', 1, '#data');
  I.stopMocking();
});

Scenario('change response data for multiple requests @WebDriver', (I) => {
  I.amOnPage('/form/fetch_call');
  I.mockRequest(
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
  I.waitForText('MY CUSTOM DATA', 1, '#data');
  I.click('GET COMMENTS');
  I.waitForText('MY CUSTOM DATA', 1, '#data');
  I.click('GET USERS');
  I.waitForText('MY CUSTOM DATA', 1, '#data');
  I.stopMocking();
});

// we should replace it with other service - https://jsonplaceholder.typicode.com not works
xScenario(
  'should request for original data after mocking stopped @Puppeteer @WebDriver',
  (I) => {
    I.amOnPage('/form/fetch_call');
    I.mockRequest('GET', 'https://jsonplaceholder.typicode.com/*', {
      comment: 'CUSTOM _uniqueId_u4805sd23',
    });
    I.click('GET COMMENTS');
    I.waitForText('_uniqueId_u4805sd23', 1, '#data');
    I.stopMocking();
    pause();

    I.click('GET COMMENTS');
    I.waitForText('laudantium', 10);
    I.dontSee('_uniqueId_u4805sd23', '#data');
  },
);
