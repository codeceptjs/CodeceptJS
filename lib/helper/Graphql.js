const Helper = require('../helper');
const requireg = require('requireg');

let axios = requireg('axios');
let headers = {};

/**
 * GraphQL helper allows to send additional requests to a GraphQl endpoint during acceptance tests.
 * [Axios](https://github.com/axios/axios) library is used to perform requests.
 *
 * ## Configuration
 *
 * * endpoint: GraphQL base URL
 * * timeout: timeout for requests in milliseconds. 10000ms by default
 * * defaultHeaders: a list of default headers
 * * onRequest: a async function which can update request object.
 *
 * ## Example
 *
 * ```js
 * GraphQL: {
 *    endpoint: 'http://site.com/graphql/',
 *    onRequest: (request) => {
 *      request.headers.auth = '123';
 *    }
 * }
 * ```
 *
 * ## Access From Helpers
 *
 * Send GraphQL requests by accessing `_executeQuery` method:
 *
 * ```js
 * this.helpers['GraphQL']._executeQuery({
 *    url,
 *    data,
 * });
 * ```
 *
 * ## Methods
 */
class GraphQL extends Helper {
  constructor(config) {
    super(config);
    axios = requireg('axios');
    this.options = {
      timeout: 10000,
      defaultHeaders: {},
      endpoint: '',
    };
    this.options = Object.assign(this.options, config);
    headers = Object.assign({}, this.options.defaultHeaders);
    axios.defaults.headers = this.options.defaultHeaders;
  }

  static _checkRequirements() {
    try {
      requireg('axios');
    } catch (e) {
      return ['axios'];
    }
  }

  async _executeQuery(request) {
    axios.defaults.timeout = request.timeout || this.options.timeout;

    if (headers && headers.auth) {
      request.auth = headers.auth;
    }

    request.headers = Object.assign(request.headers, {
      'Content-Type': 'application/json',
    });

    if (this.config.onRequest) {
      await this.config.onRequest(request);
    }

    this.debugSection('Request', JSON.stringify(request));

    let response;
    try {
      response = await axios(request);
    } catch (err) {
      if (!err.response) throw err;
      this.debugSection(
        'Response',
        `Response error. Status code: ${err.response.status}`,
      );
      response = err.response;
    }
    this.debugSection('Response', JSON.stringify(response.data));
    return response;
  }

  prepareGraphQLRequest(operation, headers) {
    const request = {
      baseURL: this.options.endpoint,
      method: 'POST',
      data: JSON.stringify(operation),
      headers,
    };
    return request;
  }

  /**
   * Send query to GraphQL endpoint over http
   *
   * ```js
   * I.sendQuery({
   *    query: 'query { user { name email }}',
   * });
   * ```
   *
   * @param {object} operation
   * @param {object} headers
   */
  async sendQuery(operation, headers = {}) {
    const request = this.prepareGraphQLRequest(operation, headers);
    return this._executeQuery(request);
  }

  /**
   * Send query to GraphQL endpoint over http
   *
   * ```js
   * I.sendMutation({
   *    query: `
   *       mutation createUser($user: UserInput!) {
   *          createUser(user: $user) {
   *            id
   *            name
   *            email
   *          }
   *        }
   *    `,
   *   variables: {
   *     user: {
   *       name: 'John Doe',
   *       email: 'john@xmail.com'
   *     }
   *   },
   * });
   * ```
   *
   * @param {object} operation
   * @param {object} headers
   */
  async sendMutation(operation, headers = {}) {
    const request = this.prepareGraphQLRequest(operation, headers);
    return this._executeQuery(request);
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
}
module.exports = GraphQL;
