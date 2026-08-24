import HelperModule from '@codeceptjs/helper'

/**
 * GraphQL helper allows to send additional requests to a GraphQl endpoint during acceptance tests.
 * native fetch API is used to perform requests.
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
    super(config)
    this.headers = {}
    this.options = {
      timeout: 10000,
      defaultHeaders: {},
      endpoint: '',
      onRequest: null,
      onResponse: null,
    }
    this.options = Object.assign(this.options, config)
    this.headers = { ...this.options.defaultHeaders }
  }

  static _checkRequirements() {
    return null
  }

  static _config() {
    return [
      {
        name: 'endpoint',
        message: 'Endpoint of API you are going to test',
        default: 'http://localhost:3000/graphql',
      },
    ]
  }

  /**
   * Executes query
   *
   * @param {object} request
   */
  async _executeQuery(request) {
    const timeout = request.timeout || this.options.timeout

    if (this.headers && this.headers.auth) {
      request.auth = this.headers.auth
    }

    request.headers = Object.assign(request.headers || {}, {
      'Content-Type': 'application/json',
    })

    request.headers = { ...this.headers, ...request.headers }

    if (this.options.onRequest) {
      await this.options.onRequest(request)
    }

    this.debugSection('Request', JSON.stringify(request))

    let response
    const url = request.url ? (request.baseURL ? request.baseURL + request.url : request.url) : request.baseURL
    const fetchOptions = {
      method: request.method || 'POST',
      headers: request.headers || {},
      signal: AbortSignal.timeout(timeout),
    }

    if (request.data) {
      fetchOptions.body = typeof request.data === 'object' ? JSON.stringify(request.data) : request.data
    }

    if (request.auth) {
      const { username, password } = request.auth
      const auth = Buffer.from(`${username}:${password}`).toString('base64')
      fetchOptions.headers.Authorization = `Basic ${auth}`
    }

    try {
      const fetchResponse = await fetch(url, fetchOptions)

      const headers = {}
      fetchResponse.headers.forEach((value, key) => {
        headers[key] = value
      })

      let data
      const contentType = headers['content-type']
      if (contentType && contentType.includes('application/json')) {
        data = await fetchResponse.json()
      } else {
        data = await fetchResponse.text()
        try {
          data = JSON.parse(data)
        } catch (e) {
          // not a json
        }
      }

      response = {
        data,
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers,
        config: request,
      }

      if (!fetchResponse.ok) {
        this.debugSection('Response', `Response error. Status code: ${fetchResponse.status}`)
      }
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`)
      }
      throw err
    }

    if (this.options.onResponse) {
      await this.options.onResponse(response)
    }

    this.debugSection('Response', JSON.stringify(response.data))
    return response
  }

  /**
   * Prepares request for fetch call
   *
   * @param {object} operation
   * @param {object} headers
   * @return {object} graphQLRequest
   */
  _prepareGraphQLRequest(operation, headers) {
    return {
      baseURL: this.options.endpoint,
      method: 'POST',
      data: operation,
      headers,
    }
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
   * @param {object} [variables] that may go along with the query
   * @param {object} [options] are additional query options
   * @param {object} [headers]
   * @return Promise<any>
   */
  async sendQuery(query, variables, options = {}, headers = {}) {
    if (typeof query !== 'string') {
      throw new Error(`query expected to be a String, instead received ${typeof query}`)
    }
    const operation = {
      query,
      variables,
      ...options,
    }
    const request = this._prepareGraphQLRequest(operation, headers)
    return this._executeQuery(request)
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
   * @param {object} [variables] that may go along with the mutation
   * @param {object} [options] are additional query options
   * @param {object} [headers]
   * @return Promise<any>
   */
  async sendMutation(mutation, variables, options = {}, headers = {}) {
    if (typeof mutation !== 'string') {
      throw new Error(`mutation expected to be a String, instead received ${typeof mutation}`)
    }
    const operation = {
      query: mutation,
      variables,
      ...options,
    }
    const request = this._prepareGraphQLRequest(operation, headers)
    return this._executeQuery(request)
  }

  _setRequestTimeout(newTimeout) {
    this.options.timeout = newTimeout
  }

  /**
   * Sets request headers for all requests of this test
   *
   * @param {object} headers headers list
   */
  haveRequestHeaders(headers) {
    this.headers = { ...this.headers, ...headers }
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
    this.haveRequestHeaders({ Authorization: `Bearer ${accessToken}` })
  }
}
export default GraphQL
