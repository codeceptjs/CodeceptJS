const { expect } = require('chai');
const joi = require('joi');
const JSONResponse = require('../../lib/helper/JSONResponse');
const Container = require('../../lib/container');
global.hermiona = require('../../lib');

const data = {
  posts: [
    {
      id: 1,
      title: 'json-server',
      author: 'davert',
    },
    {
      id: 2,
    },
  ],
  user: {
    name: 'davert',
  },
};

let restHelper;
let I;

describe('JSONResponse', () => {
  beforeEach(() => {
    Container.create({
      helpers: {
        REST: {},
      },
    });

    I = new JSONResponse();
    I._beforeSuite();
    restHelper = Container.helpers('REST');
  });

  describe('response codes', () => {
    it('should check 200x codes', async () => {
      restHelper.config.onResponse({ status: 204 });
      I.seeResponseCodeIs(204);
      I.dontSeeResponseCodeIs(200);
      I.seeResponseCodeIsSuccessful();
    });

    it('should check 300x codes', async () => {
      restHelper.config.onResponse({ status: 304 });
      I.seeResponseCodeIs(304);
      I.dontSeeResponseCodeIs(200);
      I.seeResponseCodeIsRedirection();
    });

    it('should check 400x codes', async () => {
      restHelper.config.onResponse({ status: 404 });
      I.seeResponseCodeIs(404);
      I.dontSeeResponseCodeIs(200);
      I.seeResponseCodeIsClientError();
    });

    it('should check 500x codes', async () => {
      restHelper.config.onResponse({ status: 504 });
      I.seeResponseCodeIs(504);
      I.dontSeeResponseCodeIs(200);
      I.seeResponseCodeIsServerError();
    });

    it('should throw error on invalid code', () => {
      restHelper.config.onResponse({ status: 504 });
      expect(() => I.seeResponseCodeIs(200)).to.throw('Response code');
    });
  });

  describe('response data', () => {
    it('should check for json inclusion', () => {
      restHelper.config.onResponse({ data });
      I.seeResponseContainsJson({
        posts: [
          { id: 2 },
        ],
      });
      I.seeResponseContainsJson({
        posts: [
          { id: 1, author: 'davert' },
        ],
      });
      expect(() => I.seeResponseContainsJson({ posts: [{ id: 2, author: 'boss' }] })).to.throw('expected { …(2) } to deeply match { Object (posts) }');
    });

    it('should check for json inclusion - returned Array', () => {
      const arrayData = [{ ...data }];
      restHelper.config.onResponse({ data: arrayData });
      I.seeResponseContainsJson({
        posts: [
          { id: 2 },
        ],
      });
      I.seeResponseContainsJson({
        posts: [
          { id: 1, author: 'davert' },
        ],
      });
      expect(() => I.seeResponseContainsJson({ posts: [{ id: 2, author: 'boss' }] })).to.throw('No elements in array matched {"posts":[{"id":2,"author":"boss"}]}');
    });

    it('should check for json inclusion - returned Array of 2 items', () => {
      const arrayData = [{ ...data }, { posts: { id: 3 } }];
      restHelper.config.onResponse({ data: arrayData });
      I.seeResponseContainsJson({
        posts: { id: 3 },
      });
    });

    it('should simply check for json inclusion', () => {
      restHelper.config.onResponse({ data: { user: { name: 'jon', email: 'jon@doe.com' } } });
      I.seeResponseContainsJson({ user: { name: 'jon' } });
      I.dontSeeResponseContainsJson({ user: { name: 'jo' } });
      I.dontSeeResponseContainsJson({ name: 'joe' });
    });

    it('should simply check for json inclusion - returned Array', () => {
      restHelper.config.onResponse({ data: [{ user: { name: 'jon', email: 'jon@doe.com' } }] });
      I.seeResponseContainsJson({ user: { name: 'jon' } });
      I.dontSeeResponseContainsJson({ user: { name: 'jo' } });
      I.dontSeeResponseContainsJson({ name: 'joe' });
    });

    it('should simply check for json equality', () => {
      restHelper.config.onResponse({ data: { user: 1 } });
      I.seeResponseEquals({ user: 1 });
    });

    it('should simply check for json equality - returned Array', () => {
      restHelper.config.onResponse({ data: [{ user: 1 }] });
      I.seeResponseEquals([{ user: 1 }]);
    });

    it('should check json contains keys', () => {
      restHelper.config.onResponse({ data: { user: 1, post: 2 } });
      I.seeResponseContainsKeys(['user', 'post']);
    });

    it('should check json contains keys - returned Array', () => {
      restHelper.config.onResponse({ data: [{ user: 1, post: 2 }] });
      I.seeResponseContainsKeys(['user', 'post']);
    });

    it('should check for json by callback', () => {
      restHelper.config.onResponse({ data });
      const fn = ({ expect, data }) => {
        expect(data).to.have.keys(['posts', 'user']);
      };
      I.seeResponseValidByCallback(fn);
      expect(fn.toString()).to.include('expect(data).to.have');
    });

    it('should check for json by joi schema', () => {
      restHelper.config.onResponse({ data });
      const schema = joi.object({
        posts: joi.array().items({
          id: joi.number(),
          author: joi.string(),
          title: joi.string(),
        }),
        user: joi.object({
          name: joi.string(),
        }),
      });
      const fn = () => {
        return schema;
      };
      I.seeResponseMatchesJsonSchema(fn);
      I.seeResponseMatchesJsonSchema(schema);
    });
  });
});
