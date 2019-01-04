const TestHelper = require('../support/TestHelper');
const REST = require('../../lib/helper/REST');

const api_url = TestHelper.jsonServerUrl();
const path = require('path');
const fs = require('fs');

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
      I.config.onRequest = (request) => request.data =  { name: 'Vasya' };
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
  });
});
