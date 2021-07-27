const axios = require('axios').default;
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
    this.axios = axios.create();
    this.axios.defaults.headers = this.options.defaultHeaders;
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
   *
   * @returns {Promise<*>} response
   */
  async _executeRequest(request) {
    const _debugRequest = { ...request };
    this.axios.defaults.timeout = request.timeout || this.options.timeout;

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

    let response;
    try {
      response = await this.axios(request);
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
   * @param {object} [headers={}] - the headers object to be sent. By default it is sent as an empty object
   *
   * @returns {Promise<*>} response
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
   *
   * @returns {Promise<*>} response
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
   *
   * @returns {Promise<*>} response
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
   *
   * @returns {Promise<*>} response
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
   *
   * @returns {Promise<*>} response
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
