Feature('Mocking');

const fetchPost = response => response.url() === 'https://jsonplaceholder.typicode.com/posts/1';

const fetchComments = response => response.url() === 'https://jsonplaceholder.typicode.com/comments/1';

const fetchUsers = response => response.url() === 'https://jsonplaceholder.typicode.com/users/1';

Scenario('change statusCode @Puppeteer', (I) => {
  I.amOnPage('/form/fetch_call');
  I.click('GET POSTS');
  I.waitForResponse(fetchPost, 3);
  I.mockRequest('GET', 'https://jsonplaceholder.typicode.com/*', 404);
  I.click('GET POSTS');
  I.see('Can not load data!');
  I.stopMocking();
});

Scenario('change response data @Puppeteer', (I) => {
  I.amOnPage('/form/fetch_call');
  I.click('GET COMMENTS');
  I.waitForResponse(fetchComments, 3);
  I.mockRequest('GET', 'https://jsonplaceholder.typicode.com/*', {
    modified: 'This is modified from mocking',
  });
  I.click('GET COMMENTS');
  I.see('This is modified from mocking', '#data');
  I.stopMocking();
});

Scenario('change response data for multiple requests @Puppeteer', (I) => {
  I.amOnPage('/form/fetch_call');
  I.click('GET USERS');
  I.waitForResponse(fetchUsers, 3);
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
  I.see('MY CUSTOM DATA', '#data');
  I.click('GET COMMENTS');
  I.see('MY CUSTOM DATA', '#data');
  I.click('GET USERS');
  I.see('MY CUSTOM DATA', '#data');
  I.stopMocking();
});

Scenario(
  'should request for original data after mocking stopped @Puppeteer',
  (I) => {
    I.amOnPage('/form/fetch_call');
    I.click('GET COMMENTS');
    I.mockRequest('GET', 'https://jsonplaceholder.typicode.com/*', {
      comment: 'CUSTOM',
    });
    I.click('GET COMMENTS');
    I.see('CUSTOM', '#data');
    I.stopMocking();

    I.click('GET COMMENTS');
    I.dontSee('CUSTOM', '#data');
  },
);
