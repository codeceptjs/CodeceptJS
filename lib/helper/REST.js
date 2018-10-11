const Helper = require('../helper');
const requireg = require('requireg');

let axios = requireg('axios');
let headers = {};

/**
 * REST helper allows to send additional requests to the REST API during acceptance tests.
 * [Axios](https://github.com/axios/axios) library is used to perform requests.
 *
 * ## Configuration
 *
 * * baseURL: API base URL
 * * timeout: timeout for requests in milliseconds. 10000ms by default
 * * defaultHeaders: a list of default headers
 * * resetHeaders: set to true to reset headers  between requests. Disabled by default
 *
 */
class REST extends Helper {
  constructor(config) {
    super(config);
    axios = requireg('axios');
    this.options = {
      timeout: 10000,
      resetHeaders: false,
      defaultHeaders: {},
      baseURL: '',
    };
    this.options = Object.assign(this.options, config);
    headers = Object.assign({}, this.options.defaultHeaders);
  }

  static _checkRequirements() {
    try {
      requireg('axios');
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
    if (headers && headers.auth) {
      request.auth(headers.auth);
    }
    try {
      const response = await axios(request);
      this._cleanRequestHeaders();
      return response;
    } catch (error) {
      console.log(error);
    }
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
    return url.indexOf('http') === -1 ? this.options.baseURL + url : url;
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
   * @param {*} payload
   * @param {object} headers
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
   * @param {object} payload
   * @param {object} headers
   */
  sendPatchRequest(url, payload = {}, headers = {}) {
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
   * @param {object} payload
   * @param {object} headers
   */
  sendPutRequest(url, payload = {}, headers = {}) {
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
   * @param {object} headers
   */
  sendDeleteRequest(url, headers = {}) {
    const request = {
      baseURL: this._url(url),
      method: 'DELETE',
      headers,
    };

    return this._executeRequest(request);
  }
}
module.exports = REST;
