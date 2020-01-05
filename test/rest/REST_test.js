const path = require('path');
const fs = require('fs');

const TestHelper = require('../support/TestHelper');
const REST = require('../../lib/helper/REST');

const api_url = TestHelper.jsonServerUrl();

let I;
const dbFile = path.join(__dirname, '/../data/rest/db.json');

const data = {
  posts: [
    {
      id: 1,
      title: 'json-server',
      author: 'davert',
    },
  ],
  user: {
    name: 'davert',
  },
};

describe('REST', () => {
  beforeEach((done) => {
    I = new REST({
      endpoint: api_url,
      defaultHeaders: {
        'X-Test': 'test',
      },
    });

    try {
      fs.writeFileSync(dbFile, JSON.stringify(data));
    } catch (err) {
      // continue regardless of error
    }
    setTimeout(done, 1000);
  });

  describe('basic requests', () => {
    it('should send GET requests', async () => {
      const response = await I.sendGetRequest('/user');
      response.data.name.should.eql('davert');
    });

    it('should send PATCH requests: payload format = json', async () => {
      const response = await I.sendPatchRequest('/user', { email: 'user@user.com' });
      response.data.email.should.eql('user@user.com');
    });

    it('should send PATCH requests: payload format = form urlencoded', async () => {
      const response = await I.sendPatchRequest('/user', 'email=user@user.com');
      response.data.email.should.eql('user@user.com');
    });

    it('should send POST requests: payload format = json', async () => {
      const response = await I.sendPostRequest('/user', { name: 'john' });
      response.data.name.should.eql('john');
    });

    it('should send POST requests: payload format = form urlencoded', async () => {
      const response = await I.sendPostRequest('/user', 'name=john');
      response.data.name.should.eql('john');
    });

    it('should send PUT requests: payload format = json', async () => {
      const putResponse = await I.sendPutRequest('/posts/1', { author: 'john' });
      putResponse.data.author.should.eql('john');

      const getResponse = await I.sendGetRequest('/posts/1');
      getResponse.data.author.should.eql('john');
    });

    it('should send PUT requests: payload format = form urlencoded', async () => {
      const putResponse = await I.sendPutRequest('/posts/1', 'author=john');
      putResponse.data.author.should.eql('john');

      const getResponse = await I.sendGetRequest('/posts/1');
      getResponse.data.author.should.eql('john');
    });

    it('should send DELETE requests', async () => {
      await I.sendDeleteRequest('/posts/1');
      const getResponse = await I.sendGetRequest('/posts');

      getResponse.data.should.be.empty;
    });

    it('should update request with onRequest', async () => {
      I.config.onRequest = request => (request.data = { name: 'Vasya' });

      const response = await I.sendPostRequest('/user', { name: 'john' });
      response.data.name.should.eql('Vasya');
    });

    it('should set timeout for the request', async () => {
      await I.setRequestTimeout(2000);
      const response = await I.sendGetRequest('/posts');
      response.config.timeout.should.eql(2000);
    });
  });

  describe('headers', () => {
    it('should send request headers', async () => {
      const response = await I.sendGetRequest('/user', { 'Content-Type': 'application/json' });

      response.headers.should.have.property('content-type');
      response.headers['content-type'].should.include('application/json');

      response.config.headers.should.have.property('X-Test');
      response.config.headers['X-Test'].should.eql('test');
    });

    it('should set request headers', async () => {
      const response = await I.sendGetRequest('/user', {
        'Content-Type': 'application/json',
        HTTP_X_REQUESTED_WITH: 'xmlhttprequest',
      });

      response.config.headers.should.have.property('Content-Type');
      response.config.headers['Content-Type'].should.eql('application/json');

      response.config.headers.should.have.property('X-Test');
      response.config.headers['X-Test'].should.eql('test');

      response.config.headers.should.have.property('HTTP_X_REQUESTED_WITH');
      response.config.headers.HTTP_X_REQUESTED_WITH.should.eql('xmlhttprequest');
    });

    it('should set Content-Type header if data is string and Content-Type is omitted', async () => {
      const response = await I.sendPostRequest(
        '/user',
        'string of data',
      );

      response.config.headers.should.have.property('Content-Type');
      response.config.headers['Content-Type'].should.eql('application/x-www-form-urlencoded');
    });

    it('should respect any passsed in Content-Type header', async () => {
      const response = await I.sendPostRequest(
        '/user',
        'bad json data',
        { 'Content-Type': 'application/json' },
      );

      response.config.headers.should.have.property('Content-Type');
      response.config.headers['Content-Type'].should.eql('application/json');
    });
  });

  describe('_url autocompletion', () => {
    it('should not prepend base url, when url is absolute', () => {
      I._url('https://bla.bla/blabla').should.eql('https://bla.bla/blabla');
    });

    it('should prepend base url, when url is not absolute', () => {
      I._url('/blabla').should.eql(`${api_url}/blabla`);
    });

    it('should prepend base url, when url is not absolute, and "http" in request', () => {
      I._url('/blabla&p=http://bla.bla').should.eql(`${api_url}/blabla&p=http://bla.bla`);
    });
  });

  describe('response codes', () => {
    it('should check correct response code', () => {
      I.response = { status: 200 };
      I.seeResponseCodeIs(200);
    });

    it('should check for incorrect response code', () => {
      I.response = { status: 200 };
      I.dontSeeResponseCodeIs(500);
    });

    it('should check information response code', () => {
      I.response = { status: 100 };
      I.seeResponseWasInformation();
    });

    it('should check sucessful response code', () => {
      I.response = { status: 200 };
      I.seeResponseWasSucessful();
    });

    it('should check redirect response code', () => {
      I.response = { status: 300 };
      I.seeResponseWasRedirected();
    });

    it('should check client error response code', () => {
      I.response = { status: 400 };
      I.seeResponseWasClientError();
    });

    it('should check server error response code', () => {
      I.response = { status: 500 };
      I.seeResponseWasServerError();
    });
  });
});
