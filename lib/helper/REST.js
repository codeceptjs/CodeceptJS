const axios = require('axios').default;
const expect = require('chai').expect;

const Helper = require('../helper');

/**
 * REST helper allows to send additional requests to the REST API during acceptance tests.
 * [Axios](https://github.com/axios/axios) library is used to perform requests.
 *
 * ## Configuration
 *
 * * endpoint: API base URL
 * * timeout: timeout for requests in milliseconds. 10000ms by default
 * * defaultHeaders: a list of default headers
 * * onRequest: a async function which can update request object.
 *
 * ## Example
 *
 * ```js
 *{
 *   helpers: {
 *     REST: {
 *       endpoint: 'http://site.com/api',
 *       onRequest: (request) => {
 *       request.headers.auth = '123';
 *     }
 *   }
 *}
 * ```
 *
 * ## Access From Helpers
 *
 * Send REST requests by accessing `_executeRequest` method:
 *
 * ```js
 * this.helpers['REST']._executeRequest({
 *    url,
 *    data,
 * });
 * ```
 *
 * ## Methods
 */
class REST extends Helper {
  constructor(config) {
    super(config);
    this.options = {
      timeout: 10000,
      defaultHeaders: {},
      endpoint: '',
    };
    this.options = Object.assign(this.options, config);
    this.headers = { ...this.options.defaultHeaders };
    axios.defaults.headers = this.options.defaultHeaders;
  }

  static _checkRequirements() {
    try {
      require('axios');
    } catch (e) {
      return ['axios'];
    }
  }

  /**
   * Executes axios request
   *
   * @param {*} request
   */
  async _executeRequest(request) {
    axios.defaults.timeout = request.timeout || this.options.timeout;

    if (this.headers && this.headers.auth) {
      request.auth = this.headers.auth;
    }

    if ((typeof request.data) === 'string') {
      if (!request.headers || !request.headers['Content-Type']) {
        request.headers = { ...request.headers, ...{ 'Content-Type': 'application/x-www-form-urlencoded' } };
      }
    }

    if (this.config.onRequest) {
      await this.config.onRequest(request);
    }

    this.debugSection('Request', JSON.stringify(request));

    try {
      this.response = await axios(request);
    } catch (err) {
      if (!err.response) throw err;
      this.debugSection('Response', `Response error. Status code: ${err.response.status}`);
      this.response = err.response;
    }
    this.debugSection('Response', JSON.stringify(this.response.data));
    return this.response;
  }

  /**
   * Generates url based on format sent (takes endpoint + url if latter lacks 'http')
   *
   * @param {*} url
   */
  _url(url) {
    return /^\w+\:\/\//.test(url) ? url : this.options.endpoint + url;
  }

  /**
   * Set timeout for the request
   *
   * ```js
   * I.setRequestTimeout(10000); // In milliseconds
   * ```
   *
   */
  setRequestTimeout(newTimeout) {
    this.options.timeout = newTimeout;
  }

  /**
   * Send GET request to REST API
   *
   * ```js
   * I.sendGetRequest('/api/users.json');
   * ```
   *
   * @param {*} url
   * @param {object} [headers={}] - the headers object to be sent. By default it is sent as an empty object
   */
  async sendGetRequest(url, headers = {}) {
    const request = {
      baseURL: this._url(url),
      headers,
    };
    return this._executeRequest(request);
  }

  /**
   * Sends POST request to API.
   *
   * ```js
   * I.sendPostRequest('/api/users.json', { "email": "user@user.com" });
   * ```
   *
   * @param {*} url
   * @param {*} [payload={}] - the payload to be sent. By default it is sent as an empty object
   * @param {object} [headers={}] - the headers object to be sent. By default it is sent as an empty object
   */
  async sendPostRequest(url, payload = {}, headers = {}) {
    const request = {
      baseURL: this._url(url),
      method: 'POST',
      data: payload,
      headers,
    };

    return this._executeRequest(request);
  }

  /**
   * Sends PATCH request to API.
   *
   * ```js
   * I.sendPatchRequest('/api/users.json', { "email": "user@user.com" });
   * ```
   *
   * @param {string} url
   * @param {*} [payload={}] - the payload to be sent. By default it is sent as an empty object
   * @param {object} [headers={}] - the headers object to be sent. By default it is sent as an empty object
   */
  async sendPatchRequest(url, payload = {}, headers = {}) {
    const request = {
      baseURL: this._url(url),
      method: 'PATCH',
      data: payload,
      headers,
    };

    return this._executeRequest(request);
  }

  /**
   * Sends PUT request to API.
   *
   * ```js
   * I.sendPutRequest('/api/users.json', { "email": "user@user.com" });
   * ```
   *
   * @param {string} url
   * @param {*} [payload={}] - the payload to be sent. By default it is sent as an empty object
   * @param {object} [headers={}] - the headers object to be sent. By default it is sent as an empty object
   */
  async sendPutRequest(url, payload = {}, headers = {}) {
    const request = {
      baseURL: this._url(url),
      method: 'PUT',
      data: payload,
      headers,
    };

    return this._executeRequest(request);
  }

  /**
   * Sends DELETE request to API.
   *
   * ```js
   * I.sendDeleteRequest('/api/users/1');
   * ```
   *
   * @param {*} url
   * @param {object} [headers={}] - the headers object to be sent. By default it is sent as an empty object
   */
  async sendDeleteRequest(url, headers = {}) {
    const request = {
      baseURL: this._url(url),
      method: 'DELETE',
      headers,
    };

    return this._executeRequest(request);
  }


  /**
 * Checks if the response code is equal to what was provided
 *
 * ```js
 * I.seeResponseCodeIs(200);
 * ```
 *
 * @param {string|number} statusCode
 */
  seeResponseCodeIs(statusCode) {
    expect(this.response.status).to.equal(statusCode, `Status code ${this.response.status} of response is not equal to ${statusCode}`);
  }

  /**
   * Checks if the response code is not equal to what was provided
   *
   * ```js
   * I.dontSeeResponseCodeIs(200);
   * ```
   *
   * @param {string|number} statusCode
   */
  dontSeeResponseCodeIs(statusCode) {
    expect(this.response.status).to.not.equal(statusCode, `Status code ${this.response.status} of response is equal to ${statusCode}`);
  }

  /**
   * Checks if the response code is an information response code by checking if its value is between 100-199
   *
   * ```js
   * I.seeResponseWasInformation();
   * ```
   */
  seeResponseWasInformation() {
    expect(this.response.status).to.be.above(99);
    expect(this.response.status).to.be.below(200);
  }

  /**
   * Checks if the response code is a sucessful response code by checking if its value is between 200-299
   *
   * ```js
   * I.seeResponseWasSucessful();
   * ```
   */
  seeResponseWasSucessful() {
    expect(this.response.status).to.be.above(199);
    expect(this.response.status).to.be.below(300);
  }

  /**
   * Checks if the response code is a redirect response code by checking if its value is between 300-399
   *
   * ```js
   * I.seeResponseWasRedirected();
   * ```
   */
  seeResponseWasRedirected() {
    expect(this.response.status).to.be.above(299);
    expect(this.response.status).to.be.below(400);
  }

  /**
   * Checks if the response code is an error response code by checking if its value is between 400-499
   *
   * ```js
   * I.seeResponseWasClientError();
   * ```
   */
  seeResponseWasClientError() {
    expect(this.response.status).to.be.above(399);
    expect(this.response.status).to.be.below(500);
  }

  /**
   * Checks if the response code is a server error response code by checking if its value is between 500-599
   *
   * ```js
   * I.seeResponseWasServerError();
   * ```
   */
  seeResponseWasServerError() {
    expect(this.response.status).to.be.above(499);
    expect(this.response.status).to.be.below(600);
  }

  /**
   * Checks if a header exists on the request and optionally checks the header's value
   *
   * ```js
   * I.seeHeader('Content-Type');
   * I.seeHeader('Content-Type', 'application/json');
   * ```
   *
   * @param {string} key
   * @param {string} [value=undefined]
   */
  seeHeader(key, value = undefined) {
    expect(this.response.headers).to.have.property(key);
    if (value) {
      expect(this.response.headers[key]).to.equal(value);
    }
  }

  /**
   * Checks if a header does not exist on the request
   *
   * ```js
   * I.dontSeeHeader('Content-Type');
   * ```
   *
   * @param {string} key
   */
  dontSeeHeader(key) {
    expect(this.response.headers).to.not.have.property(key);
  }

  /**
   * Returns the header from the request using the specified key
   *
   * ```js
   * I.grabHeader('Content-Type');
   * ```
   *
   * @param {string} key
   */
  grabHeader(key) {
    return this.headers[key];
  }

  /**
   * Sets an HTTP header on the request to be used in all subsequent requests
   *
   * ```js
   * I.setHeader('Content-Type', 'application/json');
   * ```
   *
   * @param {string} key
   */
  setHeader(key, value) {
    this.headers[key] = value;
  }

  /**
   * Removes an HTTP header from the request and will be removed for all subsequent requests
   *
   * ```js
   * I.removeHeader('Content-Type');
   * ```
   *
   * @param {string} key
   */
  removeHeader(key) {
    delete this.headers[key];
  }

  /**
   * Checks that the response body is equal to the provided object
   *
   * ```js
   * I.receivedCorrectResponseBody({a: 1, b: 2});
   * ```
   *
   * @param {Object} obj
   */
  receivedCorrectResponseBody(obj) {
    expect(obj).to.deep.equal(this.response.data);
  }
}
module.exports = REST;
