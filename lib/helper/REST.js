const Helper = require('../helper');
const requireg = require('requireg');
const axios = require('axios').default;

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
    this.headers = Object.assign({}, this.options.defaultHeaders);
    axios.defaults.headers = this.options.defaultHeaders;
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

    if (this.headers && this.headers.auth) {
      request.auth = this.headers.auth;
    }

    if ((typeof request.data) === 'string') {
      request.headers = Object.assign(request.headers, { 'Content-Type': 'application/x-www-form-urlencoded' });
    }

    if (this.config.onRequest) {
      await this.config.onRequest(request);
    }

    this.debugSection('Request', JSON.stringify(request));

    let response;
    try {
      response = await axios(request);
    } catch (err) {
      if (!err.response) throw err;
      this.debugSection('Response', `Response error. Status code: ${err.response.status}`);
      response = err.response;
    }
    this.debugSection('Response', JSON.stringify(response.data));
    return response;
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
   * @param {object} headers
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
  async sendPatchRequest(url, payload, headers = {}) {
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
   * @param {object} headers
   */
  async sendDeleteRequest(url, headers = {}) {
    const request = {
      baseURL: this._url(url),
      method: 'DELETE',
      headers,
    };

    return this._executeRequest(request);
  }
}
module.exports = REST;
