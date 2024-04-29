const axios = require('axios').default;
const Helper = require('@codeceptjs/helper');
const { Agent } = require('https');
const Secret = require('../secret');

const { beautify } = require('../utils');

/**
 * ## Configuration
 *
 * @typedef RESTConfig
 * @type {object}
 * @prop {string} [endpoint] - API base URL
 * @prop {boolean} [prettyPrintJson=false] - pretty print json for response/request on console logs
 * @prop {number} [timeout=1000] - timeout for requests in milliseconds. 10000ms by default
 * @prop {object} [defaultHeaders] - a list of default headers
 * @prop {object} [httpAgent] - create an agent with SSL certificate
 * @prop {function} [onRequest] - a async function which can update request object.
 * @prop {function} [onResponse] - a async function which can update response object.
 * @prop {number} [maxUploadFileSize] - set the max content file size in MB when performing api calls.
 */
const config = {};

/**
 * REST helper allows to send additional requests to the REST API during acceptance tests.
 * [Axios](https://github.com/axios/axios) library is used to perform requests.
 *
 * <!-- configuration -->
 *
 * ## Example
 *
 * ```js
 *{
 *   helpers: {
 *     REST: {
 *       endpoint: 'http://site.com/api',
 *       prettyPrintJson: true,
 *       onRequest: (request) => {
 *         request.headers.auth = '123';
 *       }
 *     }
 *   }
 *}
 * ```
 *  With httpAgent
 *
 * ```js
 * {
 *   helpers: {
 *     REST: {
 *       endpoint: 'http://site.com/api',
 *       prettyPrintJson: true,
 *       httpAgent: {
 *          key: fs.readFileSync(__dirname + '/path/to/keyfile.key'),
 *          cert: fs.readFileSync(__dirname + '/path/to/certfile.cert'),
 *          rejectUnauthorized: false,
 *          keepAlive: true
 *       }
 *     }
 *   }
 * }
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
      prettyPrintJson: false,
      onRequest: null,
      onResponse: null,
    };

    if (this.options.maxContentLength) {
      const maxContentLength = this.options.maxUploadFileSize * 1024 * 1024;
      this.options.maxContentLength = maxContentLength;
      this.options.maxBodyLength = maxContentLength;
    }

    // override defaults with config
    this._setConfig(config);

    this.headers = { ...this.options.defaultHeaders };

    // Create an agent with SSL certificate
    if (this.options.httpAgent) {
      if (!this.options.httpAgent.key || !this.options.httpAgent.cert) throw Error('Please recheck your httpAgent config!');
      this.httpsAgent = new Agent(this.options.httpAgent);
    }

    this.axios = this.httpsAgent ? axios.create({ httpsAgent: this.httpsAgent }) : axios.create();
    // @ts-ignore
    this.axios.defaults.headers = this.options.defaultHeaders;
  }

  static _config() {
    return [
      { name: 'endpoint', message: 'Endpoint of API you are going to test', default: 'http://localhost:3000/api' },
    ];
  }

  static _checkRequirements() {
    try {
      require('axios');
    } catch (e) {
      return ['axios'];
    }
  }

  _before() {
    this.headers = { ...this.options.defaultHeaders };
  }

  /**
   * Sets request headers for all requests of this test
   *
   * @param {object} headers headers list
   */
  haveRequestHeaders(headers) {
    this.headers = { ...this.headers, ...headers };
  }

  /**
   * Adds a header for Bearer authentication
   *
   * ```js
   * // we use secret function to hide token from logs
   * I.amBearerAuthenticated(secret('heregoestoken'))
   * ```
   *
   * @param {string | CodeceptJS.Secret} accessToken  Bearer access token
   */
  amBearerAuthenticated(accessToken) {
    this.haveRequestHeaders({ Authorization: `Bearer ${accessToken}` });
  }

  /**
   * Executes axios request
   *
   * @param {*} request
   *
   * @returns {Promise<*>} response
   */
  async _executeRequest(request) {
    // Add custom headers. They can be set by amBearerAuthenticated() or haveRequestHeaders()
    request.headers = { ...this.headers, ...request.headers };

    const _debugRequest = { ...request };
    this.axios.defaults.timeout = request.timeout || this.options.timeout;

    if (this.headers && this.headers.auth) {
      request.auth = this.headers.auth;
    }

    if (typeof request.data === 'object') {
      const returnedValue = {};
      for (const [key, value] of Object.entries(request.data)) {
        returnedValue[key] = value;
        if (value instanceof Secret) returnedValue[key] = value.getMasked();
      }
      _debugRequest.data = returnedValue;
    }

    if (request.data instanceof Secret) {
      _debugRequest.data = '*****';
      request.data = (typeof request.data === 'object' && !(request.data instanceof Secret)) ? { ...request.data.toString() } : request.data.toString();
    }

    if ((typeof request.data) === 'string') {
      if (!request.headers || !request.headers['Content-Type']) {
        request.headers = { ...request.headers, ...{ 'Content-Type': 'application/x-www-form-urlencoded' } };
      }
    }

    if (this.config.onRequest) {
      await this.config.onRequest(request);
    }

    this.options.prettyPrintJson ? this.debugSection('Request', beautify(JSON.stringify(_debugRequest))) : this.debugSection('Request', JSON.stringify(_debugRequest));

    let response;
    try {
      response = await this.axios(request);
    } catch (err) {
      if (!err.response) throw err;
      this.debugSection('Response', `Response error. Status code: ${err.response.status}`);
      response = err.response;
    }
    if (this.config.onResponse) {
      await this.config.onResponse(response);
    }
    this.options.prettyPrintJson ? this.debugSection('Response', beautify(JSON.stringify(response.data))) : this.debugSection('Response', JSON.stringify(response.data));
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
   * @param {number} newTimeout - timeout in milliseconds
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
   * @param {object} [headers={}] - the headers object to be sent. By default, it is sent as an empty object
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
   * @param {*} [payload={}] - the payload to be sent. By default, it is sent as an empty object
   * @param {object} [headers={}] - the headers object to be sent. By default, it is sent as an empty object
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
   * @param {object} [headers={}] - the headers object to be sent. By default, it is sent as an empty object
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
