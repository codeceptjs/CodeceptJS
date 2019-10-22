const MockRequest = require('./MockRequest');

/**
 * This helper works the same as MockRequest helper. It has been included for backwards compatibility
 * reasons. So use MockRequest helper instead of this.
 *
 * Please refer to MockRequest helper documentation for details.
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
 *    Polly: {}
 * }
 * ```
 * The same can be done when using WebDriver helper..
 *
 * ### Usage
 *
 * Use `I.mockRequest` to intercept and mock requests.
 *
 */
class Polly extends MockRequest {}

console.log('Deprecation: Polly helper was renamed to MockRequest, please update your config!');

module.exports = Polly;
