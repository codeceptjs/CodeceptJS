const requireg = require('requireg');

const Helper = require('../helper');
const { appendBaseUrl } = require('../utils');
const pollyWebDriver = require('./clientscripts/PollyWebDriverExt');

let PollyJS;

/**
 * This helper allows to **mock requests while running tests in Puppeteer or WebDriver**.
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
 * Requires Puppeteer helper or WebDriver helper enabled
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
 *    MockRequest: {}
 * }
 * ```
 *
 * > Partially works with WebDriver helper
 *
 * [Polly config options](https://netflix.github.io/pollyjs/#/configuration?id=configuration) can be passed as well:
 *
 * ```js
 * // enable replay mode
 * helpers: {
 *  Puppeteer: {
 *    // regular Puppeteer config here
 *  },
 *  MockRequest: {
 *     mode: 'replay',
 *  },
 * }
 * ```
 *
 * ### Usage
 *
 * Use `I.mockRequest` to intercept and mock requests.
 *
 */
class MockRequest extends Helper {
  constructor(config) {
    console.log('DEPRECATION NOTICE:');
    console.log('MockRequest helper was moved to a standalone package: https://github.com/codecept-js/mock-request');
    console.log('Disable MockRequest in config & install @codeceptjs/mock-request package\n');
    super(config);
    this._setConfig(config);
    PollyJS = requireg('@pollyjs/core').Polly;
    this.currentDriver = null;
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

  /**
   * Starts mocking of http requests.
   * Used by mockRequest method to automatically start
   * mocking requests.
   *
   * @param {*} title
   */
  async startMocking(title = 'Test') {
    if (!(this.helpers && (this.helpers.Puppeteer || this.helpers.WebDriver))) {
      throw new Error('Puppeteer and WebDriver are the only supported helpers right now');
    }
    if (this.helpers.Puppeteer) {
      await this._connectPuppeteer(title);
    } else if (this.helpers.WebDriver) {
      await this._connectWebDriver(title);
    }
  }

  /**
   * Creates a polly instance by registering puppeteer adapter with the instance
   *
   * @param {*} title
   */
  async _connectPuppeteer(title) {
    this.currentDriver = 'Puppeteer';
    const adapter = require('@pollyjs/adapter-puppeteer');
    PollyJS.register(adapter);

    const { page } = this.helpers.Puppeteer;
    if (!page) {
      throw new Error('Looks like, there is no open tab');
    }
    await page.setRequestInterception(true);

    const defaultConfig = {
      mode: 'passthrough',
      adapters: ['puppeteer'],
      adapterOptions: {
        puppeteer: { page },
      },
    };

    this.polly = new PollyJS(title, { ...defaultConfig, ...this.options });
  }

  /**
   * Creates polly object in the browser window context using xhr and fetch adapters,
   * after loading PollyJs and adapter scripts.
   *
   * @param {*} title
   */
  async _connectWebDriver(title) {
    this.currentDriver = 'WebDriver';
    const { browser } = this.helpers.WebDriver;
    await browser.execute(pollyWebDriver.setup, title);
    await new Promise(res => setTimeout(res, 1000));
    this.browser = browser;
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
   * @param {string|string[]} oneOrMoreUrls url(s) to mock. Can be exact URL, a pattern, or an array of URLs.
   * @param {number|string|object} dataOrStatusCode status code when number provided. A response body otherwise
   * @param {string|object} additionalData response body when a status code is set by previous parameter.
   *
   */
  async mockRequest(method, oneOrMoreUrls, dataOrStatusCode, additionalData = null) {
    await this._checkAndStartMocking();

    if (this.helpers.WebDriver) {
      return this._mockRequestForWebDriver(...arguments);
    }
    if (this.helpers.Puppeteer) {
      return this._mockRequestForPuppeteer(...arguments);
    }
  }

  _mockRequestForPuppeteer(method, oneOrMoreUrls, dataOrStatusCode, additionalData) {
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

  async _mockRequestForWebDriver(method, oneOrMoreUrls, dataOrStatusCode, additionalData) {
    const webDriverIOConfigUrl = this.helpers.WebDriver && this.helpers.WebDriver.options.url;
    await this.browser.execute(
      pollyWebDriver.mockRequest,
      method,
      oneOrMoreUrls,
      dataOrStatusCode,
      additionalData || undefined,
      this.options.url || webDriverIOConfigUrl,
    );
  }

  async _checkIfMockingStarted() {
    if (this.currentDriver === 'Puppeteer') {
      return (this.polly && this.polly.server);
    }
    if (this.currentDriver === 'WebDriver') {
      return (this.browser && this.browser.execute(pollyWebDriver.isPollyObjectInitialized));
    }
  }

  /**
   * Starts mocking if it's not started yet.
   */
  async _checkAndStartMocking() {
    if (!(await this._checkIfMockingStarted())) {
      await this.startMocking();
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
    if (!(await this._checkIfMockingStarted())) return;

    if (this.currentDriver === 'Puppeteer') {
      await this._disconnectPuppeteer();
      const { polly } = this;
      if (!polly) return;
      await polly.flush();
      await polly.stop();

      delete this.polly;
    } else if (this.currentDriver === 'WebDriver') {
      await this._disconnectWebDriver();
    }
  }

  async _disconnectPuppeteer() {
    const { page } = this.helpers.Puppeteer;
    if (page) await page.setRequestInterception(false);
  }

  async _disconnectWebDriver() {
    await this.browser.execute(pollyWebDriver.stopMocking);
    delete this.browser;
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

module.exports = MockRequest;
