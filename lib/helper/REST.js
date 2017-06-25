'user strict';
const Helper = require('../helper');
const requireg = require('requireg');
const co = require('co');
let unirest = requireg('unirest');
let headers = '';
let payload = '';
let request;

/**
 * REST helper allows to send additional requests to the REST API during acceptance tests.
 * [Unirest](http://unirest.io/nodejs.html) library is used to perform requests.
 *
 * ## Configuration
 *
 * * endpoint: API base URL
 * * timeout: timeout for requests in milliseconds. 10000 by default
 * * defaultHeaders: a list of default headers
 * * resetHeaders: set to true to reset headers  between requests. Disabled by default
 *
 */
class REST extends Helper {

  constructor(config) {
    super(config);
    unirest = requireg('unirest');

    this.options = {
      timeout: 10000,
      resetHeaders: false,
      defaultHeaders: {},
      endpoint: ''
    };
    this.options = Object.assign(this.options, config);
    headers = this.options.defaultHeaders;
  }

  static _checkRequirements() {
    try {
      requireg("unirest");
    } catch (e) {
      return ["unirest"];
    }
  }

  setRequestTimeout(newTimeout) {
    this.options.timeout = newTimeout;
  }

  /**
   * Set headers for the request
   *
   * ```js
   * I.haveRequestHeaders({
   *    'Accept': 'application/json',
   *    'User-Agent': 'Unirest Node.js'
   * });
   * ```
   *
   * @param {*} customHeaders
   */
  haveRequestHeaders(customHeaders) {
    if (!customHeaders) {
      throw new Error('Cannot send empty headers.');
    }
    headers = Object.assign(headers, customHeaders);
  }

  _cleanRequestHeaders() {
    if (this.options.resetHeaders) {
      headers = this.options.defaultHeaders;
    }
  }

  _url(url) {
    return this.options.endpoint + url;
  }

  /**
   * Send GET request to REST API
   *
   * ```js
   * I.sendGetRequest('/api/users.json');
   * ```
   *
   * @param {*} url
   * @param object headers
   */
  sendGetRequest(url, headers = {}) {
    request = unirest.get(this._url(url)).headers(headers);
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
   * @param {*} payload
   * @param object headers
   */
  sendPostRequest(url, payload = {}, headers = {}) {
    request = unirest.post(this._url(url)).send(payload).headers(headers);
    return this._executeRequest(request);
  }

  /**
   * Sends PATCH request to API.
   *
   * ```js
   * I.sendPatchRequest('/api/users.json', { "email": "user@user.com" });
   * ```
   *
   * @param string url
   * @param object payload
   * @param object headers
   */
  sendPatchRequest(url, payload = {}, headers = {}) {
    request = unirest.patch(this._url(url)).send(payload).headers(headers);
    return this._executeRequest(request);
  }

  /**
   * Sends PUT request to API.
   *
   * ```js
   * I.sendPutRequest('/api/users.json', { "email": "user@user.com" });
   * ```
   *
   * @param string url
   * @param object payload
   * @param object headers
   */
  sendPutRequest(url, payload = {}, headers = {}) {
    request = unirest.put(this._url(url)).send(payload).headers(headers);
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
   * @param {*} payload
   */
  sendDeleteRequest(url, headers = {}) {
    request = unirest.delete(this._url(url)).headers(headers);
    return this._executeRequest(request);
  }

  /**
   * Executes unirest request
   *
   * @param {*} request
   */
  _executeRequest(request) {
    if (headers && 'auth' in headers) {
      request.auth(headers.auth);
    }
    request.timeout(this.options.timeout);

    return co(executeRequest(request)).then((response) => {
      this._cleanRequestHeaders();
      return response;
    });
  }
}

module.exports = REST;

function* executeRequest(request) {
  return new Promise(function (resolve, reject) {
    request
      .headers(headers)
      .end(function (response) {
        return resolve(response) || reject(response);
      });
  });
}
