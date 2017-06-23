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
      endpoint: ''
    };
    Object.assign(this.options, config);
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
    headers = customHeaders;
  }

  _cleanRequestHeaders() {
    if (this.options.resetHeaders) {
      this.headers = {};
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
   */
  sendGetRequest(url) {
    request = unirest.get(this._url(url));
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
   */
  sendPostRequest(url, payload = {}) {
    request = unirest.post(this._url(url)).send(payload);
    return this._executeRequest(request);
  }

  /**
   * Sends PATCH request to API.
   *
   * ```js
   * I.sendPatchRequest('/api/users.json', { "email": "user@user.com" });
   * ```
   *
   * @param {*} url
   * @param {*} payload
   */
  sendPatchRequest(url, payload = {}) {
    request = unirest.patch(this._url(url)).send(payload);
    return this._executeRequest(request);
  }

  /**
   * Sends PUT request to API.
   *
   * ```js
   * I.sendPutRequest('/api/users.json', { "email": "user@user.com" });
   * ```
   *
   * @param {*} url
   * @param {*} payload
   */
  sendPutRequest(url, payload = {}) {
    request = unirest.put(this._url(url)).send(payload);
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
  sendDeleteRequest(url) {
    request = unirest.delete(this._url(url));
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
