
const TestHelper = require('../support/TestHelper');
const REST = require('../../lib/helper/REST');

const api_url = TestHelper.jsonServerUrl();
const path = require('path');
const fs = require('fs');
require('chai').should();

let I;
const dbFile = path.join(__dirname, '/../data/rest/db.json');
require('co-mocha')(require('mocha'));

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
  before(() => {
    I = new REST({
      endpoint: api_url,
      defaultHeaders: {
        'X-Test': 'test',
      },
    });
  });

  beforeEach((done) => {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(data));
    } catch (err) {}
    setTimeout(done, 700);
  });

  describe('basic requests', () => {
    it('should send GET requests', () => I.sendGetRequest('/user').then((response) => {
      response.body.name.should.eql('davert');
    }));

    it('should send POST requests', () => I.sendPostRequest('/user', { name: 'john' }).then((response) => {
      response.body.name.should.eql('john');
    }));

    it('should send PUT requests', () => I.sendPutRequest('/posts/1', { author: 'john' }).then((response) => {
      response.body.author.should.eql('john');
      return I.sendGetRequest('/posts/1').then((response) => {
        response.body.author.should.eql('john');
      });
    }));

    it('should send DELETE requests', () => I.sendDeleteRequest('/posts/1').then(response => I.sendGetRequest('/posts').then((response) => {
      response.body.should.be.empty;
    })));
  });

  describe('headers', () => {
    it('should send request headers', () => I.sendGetRequest('/headers', { 'Content-Type': 'application/json' }).then((resp) => {
      resp.body.should.have.property('content-type');
      resp.body['content-type'].should.eql('application/json');

      resp.body.should.have.property('x-test');
      resp.body['x-test'].should.eql('test');
    }));

    it('should set request headers', function* () {
      I.haveRequestHeaders({ HTTP_X_REQUESTED_WITH: 'xmlhttprequest' });
      yield I.sendGetRequest('/headers', { 'Content-Type': 'application/json' }).then((resp) => {
        resp.body.should.have.property('content-type');
        resp.body['content-type'].should.eql('application/json');

        resp.body.should.have.property('x-test');
        resp.body['x-test'].should.eql('test');

        resp.body.should.have.property('http_x_requested_with');
        resp.body.http_x_requested_with.should.eql('xmlhttprequest');
      });
    });

    it('should reset headers when flag is set', function* () {
      const defaultHeaders = {
        'X-Test': 'test',
      };
      const iResetHeaders = new REST({
        endpoint: api_url,
        defaultHeaders: Object.assign({}, defaultHeaders),
        resetHeaders: true,
      });
      const requestHeaders = {
        'X-Request-Header': 'header',
      };

      iResetHeaders.haveRequestHeaders(requestHeaders);
      yield iResetHeaders.sendGetRequest('/headers');

      const expectedHeaders = Object.assign({}, defaultHeaders, { 'content-length': 0 });

      const response = yield iResetHeaders.sendGetRequest('/headers');

      response.request.headers.should.eql(expectedHeaders);
    });
  });
});
