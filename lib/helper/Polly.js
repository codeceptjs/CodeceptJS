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

  _validateConfig(config) {
    const { url = '' } = config;
    if (typeof url !== 'string') {
      throw new Error(`Expected type of url(in Polly-config) is string, Found ${typeof url}.`);
    }
    return config;
  }

  async _after() {
    await this.stopMocking();
  }

  // Start mocking network requests/responses
  async _startMocking(title = 'Test') {
    if (!(this.helpers && this.helpers.Puppeteer)) {
      throw new Error('Puppeteer is the only supported helper right now');
    }
    await this._connectPuppeteer(title);
  }

  // Connect Puppeteer helper to mock future requests.
  async _connectPuppeteer(title) {
    const adapter = require('@pollyjs/adapter-puppeteer');
    PollyJS.register(adapter);

    const { page } = this.helpers.Puppeteer;
    if (!page) {
      throw new Error('Looks like, there is no open tab');
    }
    await page.setRequestInterception(true);

    this.polly = new PollyJS(title, {
      mode: 'passthrough',
      adapters: ['puppeteer'],
      adapterOptions: {
        puppeteer: { page },
      },
    });
  }

  /**
   * Mock response status
   *
   * ```js
   * I.mockRequest('GET', '/api/users', 200);
   * I.mockRequest('ANY', '/secretsRoutes/*', 403);
   * I.mockRequest('POST', '/secrets', { secrets: 'fakeSecrets' });
   * I.mockRequest('GET', '/api/users/1', 404, 'User not found');
   * ```
   *
   * Multiple requests
   *
   * ```js
   * I.mockRequest('GET', ['/secrets', '/v2/secrets'], 403);
   * ```
   * @param {string} method request method. Can be `GET`, `POST`, `PUT`, etc or `ANY`.
   * @param {string|array} oneOrMoreUrls url(s) to mock. Can be exact URL, a pattern, or an array of URLs.
   * @param {number|string|object} dataOrStatusCode status code when number provided. A response body otherwise
   * @param {string|object} additionalData response body when a status code is set by previous parameter.
   *
   */
  async mockRequest(method, oneOrMoreUrls, dataOrStatusCode, additionalData = null) {
    await this._checkAndStartMocking();
    const puppeteerConfigUrl = this.helpers.Puppeteer && this.helpers.Puppeteer.options.url;

    const handler = this._getRouteHandler(
      method,
      oneOrMoreUrls,
      this.options.url || puppeteerConfigUrl,
    );

    if (typeof dataOrStatusCode === 'number') {
      const statusCode = dataOrStatusCode;
      if (additionalData) {
        return handler.intercept((_, res) => res.status(statusCode).send(additionalData));
      }
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

    const { polly } = this;
    if (!polly) return;
    await polly.flush();
    await polly.stop();
    delete this.polly;
  }

  async _disconnectPuppeteer() {
    const { page } = this.helpers.Puppeteer;
    if (page) await page.setRequestInterception(false);
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
