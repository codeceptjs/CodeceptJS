const TestHelper = require('../support/TestHelper');

const ApiDataFactory = require('../../lib/helper/ApiDataFactory');

const api_url = TestHelper.jsonServerUrl();
const path = require('path');
const fs = require('fs');

let I;
const dbFile = path.join(__dirname, '/../data/rest/db.json');

const data = {
  comments: [],
  posts: [
    {
      id: 1,
      title: 'json-server',
      author: 'davert',
    },
  ],
};

const getDataFromFile = () => JSON.parse(fs.readFileSync(dbFile));

describe('ApiDataFactory', function () {
  this.timeout(20000);

  before(() => {
    I = new ApiDataFactory({
      endpoint: api_url,
      factories: {
        post: {
          factory: path.join(__dirname, '/../data/rest/posts_factory.js'),
          uri: '/posts',

        },
      },
    });
  });

  beforeEach((done) => {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(data));
    } catch (err) {
      // continue regardless of error
    }
    setTimeout(done, 5000);
  });

  afterEach(() => I._after());

  describe('create and cleanup records', function () {
    this.retries(2);

    it('should create a new post', async () => {
      await I.have('post');
      const resp = await I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(2);
    });

    it('should create a new post with predefined field', async () => {
      await I.have('post', { author: 'Tapac' });
      let resp = await I.restHelper.sendGetRequest('/posts/1');
      resp.body.author.should.eql('davert');
      resp = await I.restHelper.sendGetRequest('/posts/2');
      resp.body.author.should.eql('Tapac');
    });

    it('should cleanup created data', async () => {
      await I.have('post', { author: 'Tapac' });
      let resp = await I.restHelper.sendGetRequest('/posts/2');
      resp.body.author.should.eql('Tapac');
      await I._after();
      resp = await I.restHelper.sendGetRequest('/posts/2');
      resp.body.should.be.empty;
      resp = await I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(1);
    });

    it('should create multiple posts and cleanup after', async () => {
      let resp = await I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(1);
      await I.haveMultiple('post', 3);
      await new Promise(done => setTimeout(done, 500));
      resp = await I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(4);
      await I._after();
      await new Promise(done => setTimeout(done, 500));
      resp = await I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(1);
    });

    it('should create with different api', async () => {
      I = new ApiDataFactory({
        endpoint: api_url,
        factories: {
          post: {
            factory: path.join(__dirname, '/../data/rest/posts_factory.js'),
            uri: '/posts',
            create: { post: '/comments' },
            delete: { delete: '/comments/{id}' },
          },
        },
      });
      await I.have('post');
      let resp = await I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(1);
      resp = await I.restHelper.sendGetRequest('/comments');
      resp.body.length.should.eql(1);
    });

    it('should not remove records if cleanup:false', async () => {
      I = new ApiDataFactory({
        endpoint: api_url,
        cleanup: false,
        factories: {
          post: {
            factory: path.join(__dirname, '/../data/rest/posts_factory.js'),
            uri: '/posts',
          },
        },
      });
      await I.have('post');
      let resp = await I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(2);
      await I._after();
      await new Promise(done => setTimeout(done, 500));
      resp = await I.restHelper.sendGetRequest('/posts');
      resp.body.length.should.eql(2);
    });

    it('should send default headers', async () => {
      I = new ApiDataFactory({
        endpoint: api_url,
        REST: {
          defaultHeaders: {
            auth: '111',
          },
        },
        factories: {
          post: {
            factory: path.join(__dirname, '/../data/rest/posts_factory.js'),
            create: { post: '/headers' },
          },
        },
      });
      const resp = await I.have('post');
      resp.should.have.property('authorization');
      resp.should.have.property('auth');
      resp.auth.should.eql('111');
    });
  });
});
