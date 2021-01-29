const axios = require('axios').default;
const requireg = require('requireg');
const expect = require('expect');
const Secret = require('../secret');
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
 * * maxUploadFileSize: set the max content file size in MB when performing api calls.
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

    if (this.options.maxContentLength) {
      const maxContentLength = this.options.maxUploadFileSize * 1024 * 1024;
      this.options.maxContentLength = maxContentLength;
      this.options.maxBodyLength = maxContentLength;
    }

    this.options = { ...this.options, ...config };
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
    const _debugRequest = { ...request };
    axios.defaults.timeout = request.timeout || this.options.timeout;

    if (this.headers && this.headers.auth) {
      request.auth = this.headers.auth;
    }

    if (request.data instanceof Secret) {
      _debugRequest.data = '*****';
      request.data = typeof request.data === 'object' ? { ...request.data.toString() } : request.data.toString();
    }

    if ((typeof request.data) === 'string') {
      if (!request.headers || !request.headers['Content-Type']) {
        request.headers = { ...request.headers, ...{ 'Content-Type': 'application/x-www-form-urlencoded' } };
      }
    }

    if (this.config.onRequest) {
      await this.config.onRequest(request);
    }

    this.debugSection('Request', JSON.stringify(_debugRequest));

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
   *
   * // To mask the payload in logs
   * I.sendPostRequest('/api/users.json', secret({ "email": "user@user.com" }));
   *
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

    if (this.options.maxContentLength) {
      request.maxContentLength = this.options.maxContentLength;
      request.maxBodyLength = this.options.maxContentLength;
    }

    return this._executeRequest(request);
  }

  /**
   * Sends PATCH request to API.
   *
   * ```js
   * I.sendPatchRequest('/api/users.json', { "email": "user@user.com" });
   *
   * // To mask the payload in logs
   * I.sendPatchRequest('/api/users.json', secret({ "email": "user@user.com" }));
   *
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

    if (this.options.maxContentLength) {
      request.maxContentLength = this.options.maxContentLength;
      request.maxBodyLength = this.options.maxBodyLength;
    }

    return this._executeRequest(request);
  }

  /**
   * Sends PUT request to API.
   *
   * ```js
   * I.sendPutRequest('/api/users.json', { "email": "user@user.com" });
   *
   * // To mask the payload in logs
   * I.sendPutRequest('/api/users.json', secret({ "email": "user@user.com" }));
   *
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

    if (this.options.maxContentLength) {
      request.maxContentLength = this.options.maxContentLength;
      request.maxBodyLength = this.options.maxBodyLength;
    }

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
    expect(this.response.status).toBe(statusCode);
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
    expect(this.response.status).not.toBe(statusCode);
  }

  /**
   * Checks if the response code is a sucessful response code by checking if its value is between 200-299
   *
   * ```js
   * I.seeResponseWasSucessful();
   * ```
   */
  seeResponseWasSucessful() {
    expect(this.response.status).toBeLessThan(300);
    expect(this.response.status).toBeGreaterThan(199);
  }

  /**
   * Checks if the response code is a redirect response code by checking if its value is between 300-399
   *
   * ```js
   * I.seeResponseWasRedirected();
   * ```
   */
  seeResponseWasRedirected() {
    expect(this.response.status).toBeLessThan(400);
    expect(this.response.status).toBeGreaterThan(299);
  }

  /**
   * Checks if the response code is an error response code by checking if its value is between 400-499
   *
   * ```js
   * I.seeResponseWasClientError();
   * ```
   */
  seeResponseWasClientError() {
    expect(this.response.status).toBeLessThan(500);
    expect(this.response.status).toBeGreaterThan(399);
  }

  /**
   * Checks if the response code is a server error response code by checking if its value is between 500-599
   *
   * ```js
   * I.seeResponseWasServerError();
   * ```
   */
  seeResponseWasServerError() {
    expect(this.response.status).toBeLessThan(600);
    expect(this.response.status).toBeGreaterThan(499);
  }

  /**
   * Checks if the response code is between a specified range
   *
   * ```js
   * I.seeResponseCodeBetween(200, 299);
   * ```
   */
  seeResponseCodeBetween(min, max) {
    expect(this.response.status).toBeLessThan(max);
    expect(this.response.status).toBeGreaterThan(min);
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
    expect(this.response.headers).toHaveProperty(key)
    if (value) {
      expect(this.response.headers).toHaveProperty(key, value)
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
    expect(this.response.headers).not.toHaveProperty(key);
  }

  /**
   * Returns all headers from the request
   *
   * ```js
   * I.grabHeaders();
   * ```
   *
   */
  grabHeaders() {
    return this.headers;
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
   * @param {string} value
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
   * I.seeResponseBody({a: 1, b: 2});
   * ```
   *
   * @param {Object} obj
   */
  seeResponseBody(obj) {
    expect(obj).toEqual(this.response.data);
  }
}
module.exports = REST;
