'use strict';
let ApiDataFactory = require('../../lib/helper/ApiDataFactory');
let should = require('chai').should();
let api_url = 'http://127.0.0.1:8010';
let assert = require('assert');
let path = require('path');
let fs = require('fs');
let fileExists = require('../../lib/utils').fileExists;
let AssertionFailedError = require('../../lib/assert/error');
let expectError = require('../../lib/utils').test.expectError;
let I;
let dbFile = path.join(__dirname, '/../data/rest/db.json');
require('co-mocha')(require('mocha'));

const data = {
  "comments": [],
  "posts": [
    {
      "id": 1,
      "title": "json-server",
      "author": "davert"
    }
  ],
}

let getDataFromFile = () => JSON.parse(fs.readFileSync(dbFile));

describe('ApiDataFactory', function () {

  before(function() {
    I = new ApiDataFactory({
      endpoint: api_url,
      factories: {
        post: {
          factory: path.join(__dirname, '/../data/rest/posts_factory.js'),
          uri: "/posts"

        }
      }
    });
  });

  beforeEach((done) => {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(data));
    } catch (err) {}
    setTimeout(done, 500);
  });

  afterEach(() => {
    return I._after();
  });

  describe('create and cleanup records', function() {

    it('should create a new post', function*() {
      yield I.have('post');
      let resp = yield I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(2);
    });

    it('should create a new post with predefined field', function*() {
      yield I.have('post', { author: 'Tapac' });
      let resp = yield I.restHelper.sendGetRequest('/posts/1');
      resp.body.author.should.eql('davert');
      resp = yield I.restHelper.sendGetRequest('/posts/2');
      resp.body.author.should.eql('Tapac');
    });

    it('should cleanup created data', function*() {
      yield I.have('post', { author: 'Tapac' });
      let resp = yield I.restHelper.sendGetRequest('/posts/2');
      resp.body.author.should.eql('Tapac');
      yield I._after();
      resp = yield I.restHelper.sendGetRequest('/posts/2');
      resp.body.should.be.empty;
      resp = yield I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(1);

    });

    it('should create multiple posts and cleanup after', function*() {
      let resp = yield I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(1);
      yield I.haveMultiple('post', 3);
      yield new Promise((done) => setTimeout(done, 500));
      resp = yield I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(4);
      yield I._after();
      yield new Promise((done) => setTimeout(done, 500));
      resp = yield I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(1);
    });

    it('should create with different api', function*() {
      I = new ApiDataFactory({
        endpoint: api_url,
        factories: {
          post: {
            factory: path.join(__dirname, '/../data/rest/posts_factory.js'),
            uri: "/posts",
            create: { post: '/comments' },
            delete: { delete: '/comments/{id}'
          }
        }
      }
      });
      yield I.have('post');
      let resp = yield I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(1);
      resp = yield I.restHelper.sendGetRequest('/comments');
      resp.body.length.should.eql(1);
    });

    it('should not remove records if cleanup:false', function*() {
      I = new ApiDataFactory({
        endpoint: api_url,
        cleanup: false,
        factories: {
          post: {
            factory: path.join(__dirname, '/../data/rest/posts_factory.js'),
            uri: "/posts"
          }
        }
      });
      yield I.have('post');
      let resp = yield I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(2);
      yield I._after();
      yield new Promise((done) => setTimeout(done, 500));
      resp = yield I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(2);
    });

    it ('should send default headers', function*() {
      I = new ApiDataFactory({
        endpoint: api_url,
        REST: {
          defaultHeaders: {
            'auth': '111'
          }
        },
        factories: {
          post: {
            factory: path.join(__dirname, '/../data/rest/posts_factory.js'),
            create: { post: '/headers' }
          }
        }
      });
      let resp = yield I.have('post');
      resp.should.have.property('authorization');
      resp.should.have.property('auth');
      resp.auth.should.eql('111');

    });
  });
});