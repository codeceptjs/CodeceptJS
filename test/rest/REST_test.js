const TestHelper = require('../support/TestHelper');
const REST = require('../../lib/helper/REST');

const api_url = TestHelper.jsonServerUrl();
const path = require('path');
const fs = require('fs');
const expect = require('chai').expect;

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
    '.dot': 'dot prop',
    object: {
      id: 'custom_id',
      title: 'custom_title',
      array: ['string', 123],
      '.dot': 'dot prop',
    },
    object2: {
      id: 'custom_id',
      array: ['string', 123],
      '.dot': 'dot prop',
    },
    object3: {
      id: 'custom_id',
      '.dot': 'dot prop',
    },
    array: ['string', 123],
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
    it('should send GET requests', () => I.sendGetRequest('/user').then((response) => {
      response.data.name.should.eql('davert');
    }));

    it('should send PATCH requests: payload format = json', () => I.sendPatchRequest('/user', { email: 'user@user.com' }).then((response) => {
      response.data.email.should.eql('user@user.com');
    }));

    it('should send PATCH requests: payload format = form urlencoded', () => I.sendPatchRequest('/user', 'email=user@user.com').then((response) => {
      response.data.email.should.eql('user@user.com');
    }));

    it('should send POST requests: payload format = json', () => I.sendPostRequest('/user', { name: 'john' }).then((response) => {
      response.data.name.should.eql('john');
    }));
    it('should send POST requests: payload format = form urlencoded', () => I.sendPostRequest('/user', 'name=john').then((response) => {
      response.data.name.should.eql('john');
    }));

    it('should send PUT requests: payload format = json', () => I.sendPutRequest('/posts/1', { author: 'john' }).then((response) => {
      response.data.author.should.eql('john');
      return I.sendGetRequest('/posts/1').then((response) => {
        response.data.author.should.eql('john');
      });
    }));
    it('should send PUT requests: payload format = form urlencoded', () => I.sendPutRequest('/posts/1', 'author=john').then((response) => {
      response.data.author.should.eql('john');
      return I.sendGetRequest('/posts/1').then((response) => {
        response.data.author.should.eql('john');
      });
    }));

    it('should send DELETE requests', () => I.sendDeleteRequest('/posts/1').then(() => I.sendGetRequest('/posts').then((response) => {
      response.data.should.be.empty;
    })));

    it('should update request with onRequest', async () => {
      I.config.onRequest = request => request.data = { name: 'Vasya' };
      return I.sendPostRequest('/user', { name: 'john' }).then((response) => {
        response.data.name.should.eql('Vasya');
      });
    });

    it('should set timeout for the request', () => {
      I.setRequestTimeout(2000);
      I.sendGetRequest('/posts').then((response) => {
        response.config.timeout.should.eql(2000);
      });
    });
  });

  describe('headers', () => {
    it('should send request headers', () => I.sendGetRequest('/user', { 'Content-Type': 'application/json' }).then((resp) => {
      resp.headers.should.have.property('content-type');
      resp.headers['content-type'].should.include('application/json');

      resp.config.headers.should.have.property('X-Test');
      resp.config.headers['X-Test'].should.eql('test');
    }));

    it('should set request headers', function* () {
      yield I.sendGetRequest('/user', { 'Content-Type': 'application/json', HTTP_X_REQUESTED_WITH: 'xmlhttprequest' }).then((resp) => {
        resp.config.headers.should.have.property('Content-Type');
        resp.config.headers['Content-Type'].should.eql('application/json');

        resp.config.headers.should.have.property('X-Test');
        resp.config.headers['X-Test'].should.eql('test');

        resp.config.headers.should.have.property('HTTP_X_REQUESTED_WITH');
        resp.config.headers.HTTP_X_REQUESTED_WITH.should.eql('xmlhttprequest');
      });
    });

    it('should see request headers', function* () {
      yield I.sendGetRequest('/restheaders', { 'content-type': 'applicatiosn/json', HTTP_X_REQUESTED_WITH: 'xmlhttprequest' });
      I.seeHttpHeader('HTTP_X_REQUESTED_WITH');
      I.seeHttpHeader('X-Test', 'test');
    });

    it('should dont see request headers', function* () {
      yield I.sendGetRequest('/restheaders');
      I.dontSeeHttpHeader('HTTP_X_REQUESTED_WITH');
      I.dontSeeHttpHeader('X-Test', 'tesst');
    });

    it('should throw error when request exist headers', function* () {
      yield I.sendGetRequest('/restheaders', { 'content-type': 'applicatiosn/json', HTTP_X_REQUESTED_WITH: 'xmlhttprequest' });
      expect(I.dontSeeHttpHeader.bind(I, 'HTTP_X_REQUESTED_WITH')).to.throw();
      expect(I.dontSeeHttpHeader.bind(I, 'X-Test', 'test')).to.throw();
    });

    it('should throw error when request headers not exists', function* () {
      yield I.sendGetRequest('/restheaders');
      expect(I.seeHttpHeader.bind(I, 'HTTP_X_REQUESTED_WITH')).to.throw();
    });

    it('should set request headers by haveHttpHeader', function* () {
      I.haveHttpHeader('HTTP_X_REQUESTED_WITH', 'xmlhttprequest');
      yield I.sendGetRequest('/restheaders');
      I.seeHttpHeader('HTTP_X_REQUESTED_WITH');
    });

    it('should delete request headers', function* () {
      I.haveHttpHeader('HTTP_X_REQUESTED_WITH', 'xmlhttprequest');
      yield I.sendGetRequest('/restheaders');
      I.deleteHttpHeader('HTTP_X_REQUESTED_WITH');
      yield I.sendGetRequest('/restheaders');
      I.dontSeeHttpHeader('HTTP_X_REQUESTED_WITH');
    });

    it('should grab request header by name', function* () {
      yield I.sendGetRequest('/restheaders', { 'content-type': 'applicatiosn/json', HTTP_X_REQUESTED_WITH: 'xmlhttprequest' });
      const header = I.grabRequestHttpHeader('X-Test');
      expect(header).to.eql('test');
    });

    it('should grab request header without name', function* () {
      yield I.sendGetRequest('/restheaders', { 'content-type': 'applicatiosn/json', HTTP_X_REQUESTED_WITH: 'xmlhttprequest' });
      const header = I.grabRequestHttpHeader();
      expect(header).to.eql({ 'X-Test': 'test' });
    });

    it('should grab response header by name', function* () {
      yield I.sendGetRequest('/restheaders', { 'content-type': 'applicatiosn/json', HTTP_X_REQUESTED_WITH: 'xmlhttprequest' });
      const header = I.grabResponseHttpHeader('x-test');
      expect(header).to.eql('test');
    });

    it('should grab response header without name', function* () {
      yield I.sendGetRequest('/restheaders', { 'content-type': 'applicatiosn/json', HTTP_X_REQUESTED_WITH: 'xmlhttprequest' });
      const header = I.grabResponseHttpHeader();
      expect(header).to.have.property('x-test', 'test');
    });
  });

  describe('seeResponseContainsJson', () => {
    it('should contain by string', function* () {
      yield I.sendPostRequest('/user', data.user);
      I.seeResponseContainsJson('name', 'davert');
    });

    it('should contain by object', function* () {
      yield I.sendPostRequest('/user', data.user);
      I.seeResponseContainsJson({
        name: 'davert',
      });
    });

    it('should pass when recieved args jsonMatches like string and array[0] value', function* () {
      yield I.sendPostRequest('/user', data.user);
      I.seeResponseContainsJson('array[0]', 'string');
    });

    it('should pass when recieved args jsonMatches like array and array[1] value', function* () {
      yield I.sendPostRequest('/user', data.user);
      I.seeResponseContainsJson('array[1]', 123);
    });

    it('should pass when recieved args jsonMatches like string and object value', function* () {
      yield I.sendPostRequest('/user', data.user);
      I.seeResponseContainsJson('object.id', 'custom_id');
    });

    it('should pass when recieved args jsonMatches like object and object value with 1 property', function* () {
      yield I.sendPostRequest('/user', data.user);
      I.seeResponseContainsJson({
        'object.id': 'custom_id',
      });
    });

    it('should pass when recieved args jsonMatches like object and object value with 2 property', function* () {
      yield I.sendPostRequest('/user', data.user);
      I.seeResponseContainsJson({
        'object.id': 'custom_id',
        'object.title': 'custom_title',
      });
    });

    it('should pass when recieved args jsonMatches like object and object value with array property', function* () {
      yield I.sendPostRequest('/user', data.user);
      I.seeResponseContainsJson({
        'object.array[0]': 'string',
      });
    });

    it('should pass when recieved args jsonMatches like object and object value with string and array properties', function* () {
      yield I.sendPostRequest('/user', data.user);
      I.seeResponseContainsJson({
        'object.title': 'custom_title',
        'object.array[0]': 'string',
      });
    });

    it('should pass when recieved args jsonMatches like string which start with dot', function* () {
      yield I.sendPostRequest('/user', data.user);
      I.seeResponseContainsJson('\\.dot', 'dot prop');
    });

    it('should pass when recieved args jsonMatches like object which start with dot', function* () {
      yield I.sendPostRequest('/user', data.user);
      I.seeResponseContainsJson({
        '\\.dot': 'dot prop',
      });
    });

    it('should pass when recieved args jsonMatches like string which contain object with property which start with dot', function* () {
      yield I.sendPostRequest('/user', data.user);
      I.seeResponseContainsJson('object.\\.dot', 'dot prop');
    });

    it('should pass when recieved args jsonMatches like string which contain dot like root matches', function* () {
      yield I.sendPostRequest('/user', data.user);
      I.seeResponseContainsJson('.', data.user);
    });

    it('should contain object by object', function* () {
      yield I.sendPostRequest('/user', data.user);
      I.seeResponseContainsJson({
        object: data.user.object3,
      });
    });
  });
});
