const Helper = require('../helper');
const requireg = require('requireg');

let unirest = requireg('unirest');
let headers = {};
let request;

/**
 * REST helper allows to send additional requests to the REST API during acceptance tests.
 * [Unirest](http://unirest.io/nodejs.html) library is used to perform requests.
 *
 * ## Configuration
 *
 * * endpoint: API base URL
 * * timeout: timeout for requests in milliseconds. 10000ms by default
 * * defaultHeaders: a list of default headers
 * * resetHeaders: set to true to reset headers  between requests. Disabled by default
 * * followRedirect: set to true to enable automatic redirect. Disabled by default
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
      followRedirect: false,
      endpoint: '',
    };
    this.options = Object.assign(this.options, config);
    headers = Object.assign({}, this.options.defaultHeaders);
  }

  static _checkRequirements() {
    try {
      requireg('unirest');
    } catch (e) {
      return ['unirest'];
    }
  }

  /**
   * Executes unirest request
   *
   * @param {*} request
   */
  async _executeRequest(request) {
    if (headers && headers.auth) {
      request.auth(headers.auth);
    }
    request.timeout(this.options.timeout);
    request.followRedirect(this.options.followRedirect);
    const response = await executeRequest(request);
    this._cleanRequestHeaders();
    return response;
  }

  /**
   * Changes headers to default if reset headers option is true
   *
   */
  _cleanRequestHeaders() {
    if (this.options.resetHeaders) {
      headers = Object.assign({}, this.options.defaultHeaders);
    }
  }

  /**
   * Generates url based on format sent (takes endpoint + url if latter lacks 'http')
   *
   * @param {*} url
   */
  _url(url) {
    return url.indexOf('http') === -1 ? this.options.endpoint + url : url;
  }

  /**
   * Set response auto-redirects ON
   *
   * ```js
   * I.amFollowingRequestRedirects(); // To enable auto-redirects
   * ```
   *
   */
  amFollowingRequestRedirects() {
    this.options.followRedirect = true;
  }

  /**
   * Set response auto-redirects OFF
   *
   * ```js
   * I.amNotFollowingRequestRedirects(); // To disable auto-redirects
   * ```
   *
   */
  amNotFollowingRequestRedirects() {
    this.options.followRedirect = false;
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

  /**
   * Reset headers for the request to default state
   *
   * ```js
   * I.resetRequestHeaders();
   * ```
   *
   */
  resetRequestHeaders() {
    headers = Object.assign({}, this.options.defaultHeaders);
  }

  /**
   * Send GET request to REST API
   *
   * ```js
   * I.sendGetRequest('/api/users.json');
   * ```
   *
   * @param {*} url
   * @param {object} headers
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
   * @param {object} headers
   */
  sendPostRequest(url, payload = {}, headers = {}) {
    request = unirest.post(this._url(url)).headers(headers).send(payload);
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
   * @param {object} payload
   * @param {object} headers
   */
  sendPatchRequest(url, payload = {}, headers = {}) {
    request = unirest.patch(this._url(url)).headers(headers).send(payload);
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
   * @param {object} payload
   * @param {object} headers
   */
  sendPutRequest(url, payload = {}, headers = {}) {
    request = unirest.put(this._url(url)).headers(headers).send(payload);
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
   * @param {object} headers
   */
  sendDeleteRequest(url, headers = {}) {
    request = unirest.delete(this._url(url)).headers(headers);
    return this._executeRequest(request);
  }
}
module.exports = REST;

function executeRequest(request) {
  return new Promise((resolve) => {
    request
      .headers(headers)
      .end(response => resolve(response));
  });
}
