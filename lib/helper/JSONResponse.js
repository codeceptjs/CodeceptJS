const assert = require('assert');
const chai = require('chai');
const joi = require('joi');
const chaiDeepMatch = require('chai-deep-match');
const Helper = require('../helper');

chai.use(chaiDeepMatch);

const { expect } = chai;

/**
 * This helper allows performing assertions on JSON responses paired with following helpers:
 *
 * * REST
 * * GraphQL
 * * Playwright
 *
 * It can check status codes, response data, response structure.
 *
 *
 * ## Configuration
 *
 * * `requestHelper` - a helper which will perform requests. `REST` by default, also `Playwright` or `GraphQL` can be used. Custom helpers must have `onResponse` hook in their config, which will be executed when request is performed.
 *
 * ### Examples
 *
 * Zero-configuration when paired with REST:
 *
 * ```js
 * // inside codecept.conf.js
 *{
 *   helpers: {
 *     REST: {
 *       endpoint: 'http://site.com/api',
 *     },
 *     JSONResponse: {}
 *   }
 *}
 * ```
 * Explicitly setting request helper if you use `makeApiRequest` of Playwright to perform requests and not paired REST:
 *
 * ```js
 * // inside codecept.conf.js
 * // ...
 *   helpers: {
 *     Playwright: {
 *       url: 'https://localhost',
 *       browser: 'chromium',
 *     },
 *     JSONResponse: {
 *       requestHelper: 'Playwright',
 *     }
 *   }
 * ```
 * ## Access From Helpers
 *
 * If you plan to add custom assertions it is recommended to create a helper that will retrieve response object from JSONResponse:
 *
 *
 * ```js
 * // inside custom helper
 * const response = this.helpers.JSONResponse.response;
 * ```
 *
 * ## Methods
 */
class JSONResponse extends Helper {
  constructor(config = {}) {
    super(config);
    this.options = {
      requestHelper: 'REST',
    };
    this.options = { ...this.options, ...config };
  }

  _beforeSuite() {
    this.response = null;
    if (!this.helpers[this.options.requestHelper]) {
      throw new Error(`Error setting JSONResponse, helper ${this.options.requestHelper} is not enabled in config, helpers: ${Object.keys(this.helpers)}`);
    }
    // connect to REST helper
    this.helpers[this.options.requestHelper].config.onResponse = (response) => {
      this.response = response;
    };
  }

  _before() {
    this.response = null;
  }

  static _checkRequirements() {
    try {
      require('joi');
      require('chai');
    } catch (e) {
      return ['joi'];
    }
  }

  /**
   * Checks that response code is equal to the provided one
   *
   * ```js
   * I.seeResponseCodeIs(200);
   * ```
   *
   * @param {number} code
   */
  seeResponseCodeIs(code) {
    this._checkResponseReady();
    expect(this.response.status).to.eql(code, 'Response code is not the same as expected');
  }

  /**
   * Checks that response code is not equal to the provided one
   *
   * ```js
   * I.dontSeeResponseCodeIs(500);
   * ```
   *
   * @param {number} code
   */
  dontSeeResponseCodeIs(code) {
    this._checkResponseReady();
    expect(this.response.status).not.to.eql(code);
  }

  /**
   * Checks that the response code is 4xx
   */
  seeResponseCodeIsClientError() {
    this._checkResponseReady();
    expect(this.response.status).to.be.gte(400);
    expect(this.response.status).to.be.lt(500);
  }

  /**
   * Checks that the response code is 3xx
   */
  seeResponseCodeIsRedirection() {
    this._checkResponseReady();
    expect(this.response.status).to.be.gte(300);
    expect(this.response.status).to.be.lt(400);
  }

  /**
   * Checks that the response code is 5xx
   */
  seeResponseCodeIsServerError() {
    this._checkResponseReady();
    expect(this.response.status).to.be.gte(500);
    expect(this.response.status).to.be.lt(600);
  }

  /**
   * Checks that the response code is 2xx
   * Use it instead of seeResponseCodeIs(200) if server can return 204 instead.
   *
   * ```js
   * I.seeResponseCodeIsSuccessful();
   * ```
   */
  seeResponseCodeIsSuccessful() {
    this._checkResponseReady();
    expect(this.response.status).to.be.gte(200);
    expect(this.response.status).to.be.lt(300);
  }

  /**
   * Checks for deep inclusion of a provided json in a response data.
   *
   * ```js
   * // response.data == { user: { name: 'jon', email: 'jon@doe.com' } }
   *
   * I.seeResponseContainsJson({ user: { email: 'jon@doe.com' } });
   * ```
   * If an array is received, checks that at least one element contains JSON
   * ```js
   * // response.data == [{ user: { name: 'jon', email: 'jon@doe.com' } }]
   *
   * I.seeResponseContainsJson({ user: { email: 'jon@doe.com' } });
   * ```
   *
   * @param {object} json
   */
  seeResponseContainsJson(json = {}) {
    this._checkResponseReady();
    if (Array.isArray(this.response.data)) {
      let fails = 0;
      for (const el of this.response.data) {
        try {
          expect(el).to.deep.match(json);
        } catch (err) {
          fails++;
        }
      }
      assert.ok(fails < this.response.data.length, `No elements in array matched ${JSON.stringify(json)}`);
    } else {
      expect(this.response.data).to.deep.match(json);
    }
  }

  /**
   * Checks for deep inclusion of a provided json in a response data.
   *
   * ```js
   * // response.data == { data: { user: 1 } }
   *
   * I.dontSeeResponseContainsJson({ user: 2 });
   * ```
   * If an array is received, checks that no element of array contains json:
   * ```js
   * // response.data == [{ user: 1 }, { user: 3 }]
   *
   * I.dontSeeResponseContainsJson({ user: 2 });
   * ```
   *
   * @param {object} json
   */
  dontSeeResponseContainsJson(json = {}) {
    this._checkResponseReady();
    if (Array.isArray(this.response.data)) {
      this.response.data.forEach(data => expect(data).not.to.deep.match(json));
    } else {
      expect(this.response.data).not.to.deep.match(json);
    }
  }

  /**
   * Checks for deep inclusion of a provided json in a response data.
   *
   * ```js
   * // response.data == { user: { name: 'jon', email: 'jon@doe.com' } }
   *
   * I.seeResponseContainsKeys(['user']);
   * ```
   *
   * If an array is received, check is performed for each element of array:
   *
   * ```js
   * // response.data == [{ user: 'jon' }, { user: 'matt'}]
   *
   * I.seeResponseContainsKeys(['user']);
   * ```
   *
   * @param {array} keys
   */
  seeResponseContainsKeys(keys = []) {
    this._checkResponseReady();
    if (Array.isArray(this.response.data)) {
      this.response.data.forEach(data => expect(data).to.include.keys(keys));
    } else {
      expect(this.response.data).to.include.keys(keys);
    }
  }

  /**
   * Executes a callback function passing in `response` object and chai assertions with `expect`
   * Use it to perform custom checks of response data
   *
   * ```js
   * I.seeResponseValidByCallback(({ data, status, expect }) => {
   *   expect(status).to.eql(200);
   *   expect(data).keys.to.include(['user', 'company']);
   * });
   * ```
   *
   * @param {function} fn
   */
  seeResponseValidByCallback(fn) {
    this._checkResponseReady();
    fn({ ...this.response, expect });
    const body = fn.toString();
    fn.toString = () => `${body.split('\n')[1]}...`;
  }

  /**
   * Checks that response data equals to expected:
   *
   * ```js
   * // response.data is { error: 'Not allowed' }
   *
   * I.seeResponseEquals({ error: 'Not allowed' })
   * ```
   * @param {object} resp
   */
  seeResponseEquals(resp) {
    this._checkResponseReady();
    expect(this.response.data).to.deep.equal(resp);
  }

  /**
   * Validates JSON structure of response using [joi library](https://joi.dev).
   * See [joi API](https://joi.dev/api/) for complete reference on usage.
   *
   * Use pre-initialized joi instance by passing function callback:
   *
   * ```js
   * // response.data is { name: 'jon', id: 1 }
   *
   * I.seeResponseMatchesJsonSchema(joi => {
   *   return joi.object({
   *     name: joi.string();
   *     id: joi.number();
   *   })
   * });
   *
   * // or pass a valid schema
   * const joi = require('joi);
   *
   * I.seeResponseMatchesJsonSchema(joi.object({
   *   name: joi.string();
   *   id: joi.number();
   * });
   * ```
   *
   * @param {any} fnOrSchema
   */
  seeResponseMatchesJsonSchema(fnOrSchema) {
    this._checkResponseReady();
    let schema = fnOrSchema;
    if (typeof fnOrSchema === 'function') {
      schema = fnOrSchema(joi);
      const body = fnOrSchema.toString();
      fnOrSchema.toString = () => `${body.split('\n')[1]}...`;
    }
    if (!schema) throw new Error('Empty Joi schema provided, see https://joi.dev/ for details');
    if (!joi.isSchema(schema)) throw new Error('Invalid Joi schema provided, see https://joi.dev/ for details');
    schema.toString = () => schema.describe();
    joi.assert(this.response.data, schema);
  }

  _checkResponseReady() {
    if (!this.response) throw new Error('Response is not available');
  }
}

module.exports = JSONResponse;
