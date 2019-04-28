const Helper = require('../helper');
const requireg = require('requireg');
const expect = require('chai').expect;

let axios = requireg('axios');

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
 * REST: {
 *    endpoint: 'http://site.com/api',
 *    onRequest: (request) => {
 *      request.headers.auth = '123';
 *    }
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
    axios = requireg('axios');
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

    request.headers = Object.assign(request.headers, this.headers);

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
    return url.indexOf('http') === -1 ? this.options.endpoint + url : url;
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

  /**
   * Checks response code equals to provided value.
   *
   * ```js
   * I.seeResponseCodeIs(200)
   * ```
   *
   * @param {number} statusCode
   */
  seeResponseCodeIs(statusCode) {
    expect(this.response.status).to.equal(statusCode, 'Response status code not equal expected');
  }

  /**
   * Checks that response code is not equal to provided value.
   *
   * ```js
   * I.dontSeeResponseCodeIs(404)
   * ```
   *
   * @param {number} statusCode
   */
  dontSeeResponseCodeIs(statusCode) {
    expect(this.response.status).to.not.equal(statusCode, `Response status code is ${statusCode}`);
  }

  /**
   * Checks over the given HTTP header and (optionally) its value
   *
   * ```js
   * I.seeHttpHeader('content-type');
   * I.seeHttpHeader('content-type', 'application/json; charset=utf-8');
   * ```
   *
   * @param {string} name
   * @param {string|undefined} value
   */
  seeHttpHeader(name, value = undefined) {
    if (value) {
      expect(this.response.headers[name.toLowerCase()]).to.equal(value);
    } else {
      expect(this.response.headers).to.have.property(name.toLowerCase());
    }
  }

  /**
   * Checks over the given HTTP header and (optionally) its value, asserting that are not there
   *
   * ```js
   * I.dontSeeHttpHeader('content-type');
   * I.dontSeeHttpHeader('content-type', 'application/json; charset=utf-8');
   * ```
   *
   * @param {string} name
   * @param {string|undefined} value
   */
  dontSeeHttpHeader(name, value = undefined) {
    if (value) {
      expect(this.response.headers[name.toLowerCase()]).to.not.equal(value);
    } else {
      expect(this.response.headers).to.not.have.property(name.toLowerCase());
    }
  }

  /**
   * Returns the value of the specified header name from request.
   * If name not specified, return all headers
   *
   * ```js
   * I.grabRequestHttpHeader('content-type')
   * ```
   *
   * @param {string|undefined} name
   */
  grabRequestHttpHeader(name = undefined) {
    if (name) {
      return this.headers[name];
    }
    return this.headers;
  }

  /**
   * Returns the value of the specified header name from response.
   * If name not specified, return all headers
   *
   * ```js
   * I.grabResponseHttpHeader('content-type')
   * ```
   *
   * @param {string|undefined} name
   */
  grabResponseHttpHeader(name = undefined) {
    // @todo: А что если нет? нужна проверка
    if (name) {
      return this.response.headers[name];
    }
    return this.response.headers;
  }

  /**
   * Sets HTTP header valid for all next requests. Use deleteHeader to unset it
   *
   * ```js
   * I.haveHttpHeader('HTTP_X_REQUESTED_WITH', 'xmlhttprequest')
   * // all next requests will contain this header
   * ```
   *
   * @param {string} name
   * @param {string} value
   */
  haveHttpHeader(name, value) {
    this.headers[name] = value;
  }

  /**
   * Deletes the header with the passed name. Subsequent requests will not have the deleted header in its request.
   *
   * @param {string} name
   */
  deleteHttpHeader(name) {
    delete this.headers[name];
  }

  /**
   * Returns current response so that it can be used in next scenario steps.
   */
  grabResponse() {
    return this.response;
  }

  /**
   * Checks whether the last JSON response contains data by json path.
   *
   * ```js
   * I.seeResponseContainsJson('items[0]', response.result);
   * I.seeResponseContainsJson('items[0].id', response.result.id);
   * // If . or [] are part of an actual property name, they can be escaped by adding two backslashes before them.
   * I.seeResponseContainsJson('items[0].\\.id', response.result['.id']);
   * I.seeResponseContainsJson({
   *  'name': generatedFolder.name,
   *  'id': generatedFolder.id,
   *  'roles[0]': generatedFolder.roles[0],
   * });
   * I.seeResponseContainsJson('.', createResponse.result); // check root
   * ```
   *
   * @param {string|object} jsonMatches
   * @param {any|undefined} value
   */
  seeResponseContainsJson(jsonMatches, value) {
    return proceedSeeResponseJson.call(this, jsonMatches, value);
  }
}
module.exports = REST;


function proceedSeeResponseJson(jsonMatches, value) {
  const data = this.response.data;
  expect(data).to.not.equal(undefined, 'Response is empty.');
  expect(data).to.not.equal(null, 'Response is empty.');

  if (typeof jsonMatches === 'object') _nestedExpectObject(data, jsonMatches);
  else if (Array.isArray(value)) _nestedExpectArray(data, jsonMatches, value);
  else if (jsonMatches.startsWith('.')) expect(data).to.deep.equal(value);
  else expect(data).to.have.deep.nested.property(jsonMatches, value);
}

function _nestedExpectObject(data, jsonMatches) {
  Object.keys(jsonMatches).forEach((key) => {
    if (Array.isArray(jsonMatches[key])) _nestedExpectArray(data, key, jsonMatches[key]);
    else if (typeof jsonMatches[key] === 'object') {
      Object.keys(jsonMatches[key]).forEach((val) => {
        if (val.startsWith('.')) {
          expect(data).to.have.nested.property(`${key}.\\${val}`, jsonMatches[key][val]);
        } else {
          expect(data).to.have.nested.property(`${key}.${val}`, jsonMatches[key][val]);
        }
      });
    } else {
      expect(data).to.have.nested.property(key, jsonMatches[key]);
    }
  });
}

function _nestedExpectArray(data, key, value) {
  const matchesArray = {};
  for (let i = 0; i < value.length; i++) {
    matchesArray[`${key}[${i}]`] = value[i];
    expect(data).to.deep.nested.include(matchesArray);
  }
}
