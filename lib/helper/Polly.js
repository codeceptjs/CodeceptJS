const Helper = require('../helper');
const requireg = require('requireg');
const { appendBaseUrl } = require('../utils');

let PollyJS;

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

  /**
   * Start mocking network requests/responses
   *
   * ```js
   * I.startMocking('Backend APIs');
   * ```
   */
  async startMocking(title = 'Test') {
    if (!this.helpers && !this.helpers.Puppeteer) {
      throw new Error('Puppeteer is the only supported helper right now');
    }
    return this._connectPuppeteer(title);
  }

  /**
   * Connect Puppeteer helper to mock future requests.
   */
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
  }

  /**
   * Mock response status
   *
   * ```js
   * I.mock('GET', '/api/users', 200);
   * I.mock('ANY', '/secretsRoutes/*', 403);
   * I.mock('POST', '/secrets', { secrets: 'fakeSecrets' });
   * ```
   *
   * Multiple requests
   *
   * ```js
   * I.mock('GET', ['/secrets', '/v2/secrets'], 403);
   * ```
   */
  async mock(method, oneOrMoreUrls, dataOrStatusCode) {
    this._checkIfMockingStarted();
    const handler = await this._getRouteHandler(
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

  /**
   * Checks whether mocking is started.
   */
  _checkIfMockingStarted() {
    if (!this.polly || !this.polly.server) {
      throw new Error("Please use 'I.startMocking()' to start mocking.");
    }
  }

  /**
   * Get route-handler of Polly for different HTTP methods
   * @param {string} method HTTP request methods(e.g., 'GET', 'POST')
   * @param {string|array} oneOrMoreUrls URL or array of URLs
   * @param {string} baseUrl hostURL
   */
  async _getRouteHandler(method, oneOrMoreUrls, baseUrl) {
    this._checkIfMockingStarted();
    const { server } = this.polly;

    oneOrMoreUrls = appendBaseUrl(baseUrl, oneOrMoreUrls);
    method = method.toLowerCase();

    if (httpMethods.includes(method)) {
      return server[method](oneOrMoreUrls);
    }
    return server.any(oneOrMoreUrls);
  }

  /**
   * Stop mocking requests.
   */
  async stopMocking() {
    this._checkIfMockingStarted();
    await this.polly.stop();
    await this.polly.flush();
    this.polly = undefined;
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
