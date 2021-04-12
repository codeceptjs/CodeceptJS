const axios = require('axios').default;
const Helper = require('../helper');

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
    this.axios = axios.create();
    this.headers = {};
    this.options = {
      timeout: 10000,
      defaultHeaders: {},
      endpoint: '',
    };
    this.options = Object.assign(this.options, config);
    this.headers = { ...this.options.defaultHeaders };
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
   * Executes query via axios call
   *
   * @param {object} request
   */
  async _executeQuery(request) {
    this.axios.defaults.timeout = request.timeout || this.options.timeout;

    if (this.headers && this.headers.auth) {
      request.auth = this.headers.auth;
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
      response = await this.axios(request);
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

  /**
   * Prepares request for axios call
   *
   * @param {object} operation
   * @param {object} headers
   */
  _prepareGraphQLRequest(operation, headers) {
    const request = {
      baseURL: this.options.endpoint,
      method: 'POST',
      data: operation,
      headers,
    };
    return request;
  }

  /**
   * Send query to GraphQL endpoint over http.
   * Returns a response as a promise.
   *
   * ```js
   *
   * const response = await I.sendQuery('{ users { name email }}');
   * // with variables
   * const response = await I.sendQuery(
   *  'query getUser($id: ID) { user(id: $id) { name email }}',
   *  { id: 1 },
   * )
   * const user = response.data.data;
   * ```
   *
   * @param {String} query
   * @param {object} variables that may go along with the query
   * @param {object} options are additional query options
   * @param {object} headers
   */
  async sendQuery(query, variables, options = {}, headers = {}) {
    if (typeof query !== 'string') {
      throw new Error(`query expected to be a String, instead received ${typeof query}`);
    }
    const operation = {
      query,
      variables,
      ...options,
    };
    const request = this._prepareGraphQLRequest(operation, headers);
    return this._executeQuery(request);
  }

  /**
   * Send query to GraphQL endpoint over http
   *
   * ```js
   * I.sendMutation(`
   *       mutation createUser($user: UserInput!) {
   *          createUser(user: $user) {
   *            id
   *            name
   *            email
   *          }
   *        }
   *    `,
   *   { user: {
   *       name: 'John Doe',
   *       email: 'john@xmail.com'
   *     }
   *   },
   * });
   * ```
   *
   * @param {String} mutation
   * @param {object} variables that may go along with the mutation
   * @param {object} options are additional query options
   * @param {object} headers
   */
  async sendMutation(mutation, variables, options = {}, headers = {}) {
    if (typeof mutation !== 'string') {
      throw new Error(`mutation expected to be a String, instead received ${typeof mutation}`);
    }
    const operation = {
      query: mutation,
      variables,
      ...options,
    };
    const request = this._prepareGraphQLRequest(operation, headers);
    return this._executeQuery(request);
  }

  _setRequestTimeout(newTimeout) {
    this.options.timeout = newTimeout;
  }
}
module.exports = GraphQL;
