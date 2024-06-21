const { mock, settings } = require('pactum')

/**
 * ## Configuration
 *
 * This helper should be configured in codecept.conf.(js|ts)
 *
 * @typedef MockServerConfig
 * @type {object}
 * @prop {number} [port=9393] - Mock server port
 * @prop {string} [host="0.0.0.0"] - Mock server host
 * @prop {object} [httpsOpts] - key & cert values are the paths to .key and .crt files
 */
let config = {
  port: 9393,
  host: '0.0.0.0',
  httpsOpts: {
    key: '',
    cert: '',
  },
}

/**
 * MockServer
 *
 * The MockServer Helper in CodeceptJS empowers you to mock any server or service via HTTP or HTTPS, making it an excellent tool for simulating REST endpoints and other HTTP-based APIs.
 *
 * <!-- configuration -->
 *
 * #### Examples
 *
 * You can seamlessly integrate MockServer with other helpers like REST or Playwright. Here's a configuration example inside the `codecept.conf.js` file:
 *
 * ```javascript
 * {
 *   helpers: {
 *     REST: {...},
 *     MockServer: {
 *       // default mock server config
 *       port: 9393,
 *       host: '0.0.0.0',
 *       httpsOpts: {
 *         key: '',
 *         cert: '',
 *       },
 *     },
 *   }
 * }
 * ```
 *
 * #### Adding Interactions
 *
 * Interactions add behavior to the mock server. Use the `I.addInteractionToMockServer()` method to include interactions. It takes an interaction object as an argument, containing request and response details.
 *
 * ```javascript
 * I.addInteractionToMockServer({
 *    request: {
 *      method: 'GET',
 *      path: '/api/hello'
 *    },
 *    response: {
 *      status: 200,
 *      body: {
 *        'say': 'hello to mock server'
 *      }
 *    }
 * });
 * ```
 *
 * #### Request Matching
 *
 * When a real request is sent to the mock server, it matches the received request with the interactions. If a match is found, it returns the specified response; otherwise, a 404 status code is returned.
 *
 * - Strong match on HTTP Method, Path, Query Params & JSON body.
 * - Loose match on Headers.
 *
 * ##### Strong Match on Query Params
 *
 * You can send different responses based on query parameters:
 *
 * ```javascript
 * I.addInteractionToMockServer({
 *   request: {
 *     method: 'GET',
 *     path: '/api/users',
 *     queryParams: {
 *       id: 1
 *     }
 *   },
 *   response: {
 *     status: 200,
 *     body: 'user 1'
 *   }
 * });
 *
 * I.addInteractionToMockServer({
 *   request: {
 *     method: 'GET',
 *     path: '/api/users',
 *     queryParams: {
 *       id: 2
 *     }
 *   },
 *   response: {
 *     status: 200,
 *     body: 'user 2'
 *   }
 * });
 * ```
 *
 * - GET to `/api/users?id=1` will return 'user 1'.
 * - GET to `/api/users?id=2` will return 'user 2'.
 * - For all other requests, it returns a 404 status code.
 *
 * ##### Loose Match on Body
 *
 * When `strict` is set to false, it performs a loose match on query params and response body:
 *
 * ```javascript
 * I.addInteractionToMockServer({
 *   strict: false,
 *   request: {
 *     method: 'POST',
 *     path: '/api/users',
 *     body: {
 *       name: 'john'
 *     }
 *   },
 *   response: {
 *     status: 200
 *   }
 * });
 * ```
 *
 * - POST to `/api/users` with the body containing `name` as 'john' will return a 200 status code.
 * - POST to `/api/users` without the `name` property in the body will return a 404 status code.
 *
 * Happy testing with MockServer in CodeceptJS! 🚀
 *
 * ## Methods
 */
class MockServer {
  constructor(passedConfig) {
    settings.setLogLevel('SILENT')
    config = { ...passedConfig }
    if (global.debugMode) {
      settings.setLogLevel('VERBOSE')
    }
  }

  /**
   * Start the mock server
   * @param {number} [port] start the mock server with given port
   *
   * @returns void
   */
  async startMockServer(port) {
    const _config = { ...config }
    if (port) _config.port = port
    await mock.setDefaults(_config)
    await mock.start()
  }

  /**
   * Stop the mock server
   *
   * @returns void
   *
   */
  async stopMockServer() {
    await mock.stop()
  }

  /**
   * An interaction adds behavior to the mock server
   *
   *
   * ```js
   * I.addInteractionToMockServer({
   *    request: {
   *      method: 'GET',
   *      path: '/api/hello'
   *    },
   *    response: {
   *      status: 200,
   *      body: {
   *        'say': 'hello to mock server'
   *      }
   *    }
   * });
   * ```
   * ```js
   * // with query params
   * I.addInteractionToMockServer({
   *    request: {
   *      method: 'GET',
   *      path: '/api/hello',
   *      queryParams: {
   *       id: 2
   *     }
   *    },
   *    response: {
   *      status: 200,
   *      body: {
   *        'say': 'hello to mock server'
   *      }
   *    }
   * });
   * ```
   *
   * @param {CodeceptJS.MockInteraction|object} interaction add behavior to the mock server
   *
   * @returns void
   *
   */
  async addInteractionToMockServer(interaction) {
    await mock.addInteraction(interaction)
  }
}

module.exports = MockServer
