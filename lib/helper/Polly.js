const Helper = require('../helper');
const requireg = require('requireg');
const { appendBaseUrl } = require('../utils');

let PollyJS;

/**
 * This helper allows to **mock requests while running tests in Puppeteer**.
 * For instance, you can block calls to 3rd-party services like Google Analytics, CDNs.
 * Another way of using is to emulate requests from server by passing prepared data.
 *
 * ### Installations
 *
 * Requires [Polly.js](https://netflix.github.io/pollyjs/#/) library by Netflix installed
 *
 * ```
 * npm i @pollyjs/core @pollyjs/adapter-puppeteer --save-dev
 * ```
 *
 * Requires Puppeteer helper enabled
 *
 * ### Configuration
 *
 * Just enable helper in config file:
 *
 * ```js
 * helpers: {
 *    Puppeteer: {
 *      // regular Puppeteer config here
 *    },
 *    Polly: {}
 * }
 * ```
 *
 * ### Usage
 *
 * Use `I.mockRequest` to intercept and mock requests.
 *
 */
class Polly extends Helper {
  constructor(config) {
    super(config);
    this._setConfig(config);
    PollyJS = requireg('@pollyjs/core').Polly;
  }

  static _checkRequirements() {
    try {
      requireg('@pollyjs/core');
    } catch (e) {
      return ['@pollyjs/core@^2.5.0'];
    }
  }

  // Start mocking network requests/responses
  async _startMocking(title = 'Test') {
    if (!this.helpers && !this.helpers.Puppeteer) {
      throw new Error('Puppeteer is the only supported helper right now');
    }
    await this._connectPuppeteer(title);
  }

  // Connect Puppeteer helper to mock future requests.
  async _connectPuppeteer(title) {
    const adapter = require('@pollyjs/adapter-puppeteer');

    PollyJS.register(adapter);
    const { page } = this.helpers.Puppeteer;
    await page.setRequestInterception(true);

    this.polly = new PollyJS(title, {
      adapters: ['puppeteer'],
      adapterOptions: {
        puppeteer: { page },
      },
    });

    // By default let pass through all network requests
    if (this.polly) this.polly.server.any().passthrough();
  }

  /**
   * Mock response status
   *
   * ```js
   * I.mockRequest('GET', '/api/users', 200);
   * I.mockRequest('ANY', '/secretsRoutes/*', 403);
   * I.mockRequest('POST', '/secrets', { secrets: 'fakeSecrets' });
   * ```
   *
   * Multiple requests
   *
   * ```js
   * I.mockRequest('GET', ['/secrets', '/v2/secrets'], 403);
   * ```
   */
  async mockRequest(method, oneOrMoreUrls, dataOrStatusCode) {
    await this._checkAndStartMocking();
    const handler = this._getRouteHandler(
      method,
      oneOrMoreUrls,
      this.options.url,
    );

    if (typeof dataOrStatusCode === 'number') {
      const statusCode = dataOrStatusCode;
      return handler.intercept((_, res) => res.sendStatus(statusCode));
    }
    const data = dataOrStatusCode;
    return handler.intercept((_, res) => res.send(data));
  }

  _checkIfMockingStarted() {
    return this.polly && this.polly.server;
  }

  /**
   * Starts mocking if it's not started yet.
   */
  async _checkAndStartMocking() {
    if (!this._checkIfMockingStarted()) {
      await this._startMocking();
    }
  }

  // Get route-handler of Polly for different HTTP methods
  // @param {string} method HTTP request methods(e.g., 'GET', 'POST')
  // @param {string|array} oneOrMoreUrls URL or array of URLs
  // @param {string} baseUrl hostURL
  _getRouteHandler(method, oneOrMoreUrls, baseUrl) {
    const { server } = this.polly;

    oneOrMoreUrls = appendBaseUrl(baseUrl, oneOrMoreUrls);
    method = method.toLowerCase();

    if (httpMethods.includes(method)) {
      return server[method](oneOrMoreUrls);
    }
    return server.any(oneOrMoreUrls);
  }

  /**
   * Stops mocking requests.
   */
  async stopMocking() {
    if (!this._checkIfMockingStarted()) return;

    await this._disconnectPuppeteer();
    await this.polly.flush();
    await this.polly.stop();
    this.polly = undefined;
  }

  async _disconnectPuppeteer() {
    const { page } = this.helpers.Puppeteer;
    await page.setRequestInterception(false);
  }
}

const httpMethods = [
  'get',
  'put',
  'post',
  'patch',
  'delete',
  'merge',
  'head',
  'options',
];

module.exports = Polly;
