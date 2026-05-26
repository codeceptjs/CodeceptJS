import * as chai from 'chai'
import { z } from 'zod'
import { JSONResponse } from '../../lib/helper/JSONResponse.js'
import Container from '../../lib/container.js'
import * as codeceptjs from '../../lib/index.js'

const expect = chai.expect
global.codeceptjs = codeceptjs.default || codeceptjs

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
}

let restHelper
let I

describe('JSONResponse', () => {
  beforeEach(async () => {
    await Container.create({
      helpers: {
        REST: {},
      },
    })

    I = new JSONResponse()
    I._beforeSuite()
    restHelper = Container.helpers('REST')
  })

  describe('response codes', () => {
    it('should check 200x codes', async () => {
      restHelper.options.onResponse({ status: 204 })
      I.seeResponseCodeIs(204)
      I.dontSeeResponseCodeIs(200)
      I.seeResponseCodeIsSuccessful()
    })

    it('should check 300x codes', async () => {
      restHelper.options.onResponse({ status: 304 })
      I.seeResponseCodeIs(304)
      I.dontSeeResponseCodeIs(200)
      I.seeResponseCodeIsRedirection()
    })

    it('should check 400x codes', async () => {
      restHelper.options.onResponse({ status: 404 })
      I.seeResponseCodeIs(404)
      I.dontSeeResponseCodeIs(200)
      I.seeResponseCodeIsClientError()
    })

    it('should check 500x codes', async () => {
      restHelper.options.onResponse({ status: 504 })
      I.seeResponseCodeIs(504)
      I.dontSeeResponseCodeIs(200)
      I.seeResponseCodeIsServerError()
    })

    it('should throw error on invalid code', () => {
      restHelper.options.onResponse({ status: 504 })
      expect(() => I.seeResponseCodeIs(200)).to.throw('Response code')
    })
  })

  describe('response data', () => {
    it('should check for json inclusion', () => {
      restHelper.options.onResponse({ data })
      I.seeResponseContainsJson({
        posts: [{ id: 2 }],
      })
      I.seeResponseContainsJson({
        posts: [{ id: 1, author: 'davert' }],
      })
      expect(() => I.seeResponseContainsJson({ posts: [{ id: 2, author: 'boss' }] })).to.throw('No matching element found in array for {"id":2,"author":"boss"}')
    })

    it('should check for json inclusion - returned Array', () => {
      const arrayData = [{ ...data }]
      restHelper.options.onResponse({ data: arrayData })
      I.seeResponseContainsJson({
        posts: [{ id: 2 }],
      })
      I.seeResponseContainsJson({
        posts: [{ id: 1, author: 'davert' }],
      })
      expect(() => I.seeResponseContainsJson({ posts: [{ id: 2, author: 'boss' }] })).to.throw('No elements in array matched {"posts":[{"id":2,"author":"boss"}]}')
    })

    it('should check for json inclusion - returned Array of 2 items', () => {
      const arrayData = [{ ...data }, { posts: { id: 3 } }]
      restHelper.options.onResponse({ data: arrayData })
      I.seeResponseContainsJson({
        posts: { id: 3 },
      })
    })

    it('should simply check for json inclusion', () => {
      restHelper.options.onResponse({ data: { user: { name: 'jon', email: 'jon@doe.com' } } })
      I.seeResponseContainsJson({ user: { name: 'jon' } })
      I.dontSeeResponseContainsJson({ user: { name: 'jo' } })
      I.dontSeeResponseContainsJson({ name: 'joe' })
    })

    it('should simply check for json inclusion - returned Array', () => {
      restHelper.options.onResponse({ data: [{ user: { name: 'jon', email: 'jon@doe.com' } }] })
      I.seeResponseContainsJson({ user: { name: 'jon' } })
      I.dontSeeResponseContainsJson({ user: { name: 'jo' } })
      I.dontSeeResponseContainsJson({ name: 'joe' })
    })

    it('should simply check for json equality', () => {
      restHelper.options.onResponse({ data: { user: 1 } })
      I.seeResponseEquals({ user: 1 })
    })

    it('should simply check for json equality - returned Array', () => {
      restHelper.options.onResponse({ data: [{ user: 1 }] })
      I.seeResponseEquals([{ user: 1 }])
    })

    it('should check json contains keys', () => {
      restHelper.options.onResponse({ data: { user: 1, post: 2 } })
      I.seeResponseContainsKeys(['user', 'post'])
    })

    it('should check json contains keys - returned Array', () => {
      restHelper.options.onResponse({ data: [{ user: 1, post: 2 }] })
      I.seeResponseContainsKeys(['user', 'post'])
    })

    it('should check for json by callback', () => {
      restHelper.options.onResponse({ data })
      const fn = ({ assert, data }) => {
        assert('posts' in data)
        assert('user' in data)
      }
      I.seeResponseValidByCallback(fn)
      expect(fn.toString()).to.include("assert('posts' in data)")
    })

    it('should check for json by zod schema', () => {
      restHelper.options.onResponse({ data })
      const schema = z.object({
        posts: z.array(
          z.object({
            id: z.number(),
            author: z.string(),
            title: z.string(),
          }),
        ),
        user: z.object({
          name: z.string(),
        }),
      })
      const fn = () => {
        return schema
      }
      I.seeResponseMatchesJsonSchema(fn)
      I.seeResponseMatchesJsonSchema(schema)
    })

    it('should throw error when zod validation fails', () => {
      restHelper.options.onResponse({ data: { name: 'invalid', age: 'not_a_number' } })
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      })
      expect(() => I.seeResponseMatchesJsonSchema(schema)).to.throw('Schema validation failed')
    })
  })
})
