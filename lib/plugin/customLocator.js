const Locator = require('../locator');
const { xpathLocator } = require('../utils');

const defaultConfig = {
  prefix: '$',
  attribute: 'data-test-id',
  strategy: 'xpath',
  showActual: false,
};

/**
 * Creates a [custom locator](https://codecept.io/locators#custom-locators) by using special attributes in HTML.
 *
 * If you have a convention to use `data-test-id` or `data-qa` attributes to mark active elements for e2e tests,
 * you can enable this plugin to simplify matching elements with these attributes:
 *
 * ```js
 * // replace this:
 * I.click({ css: '[data-test-id=register_button]');
 * // with this:
 * I.click('$register_button');
 * ```
 * This plugin will create a valid XPath locator for you.
 *
 * #### Configuration
 *
 * * `enabled` (default: `false`) should a locator be enabled
 * * `prefix` (default: `$`) sets a prefix for a custom locator.
 * * `attribute` (default: `data-test-id`) to set an attribute to be matched.
 * * `strategy` (default: `xpath`) actual locator strategy to use in query (`css` or `xpath`).
 * * `showActual` (default: false) show in the output actually produced XPath or CSS locator. By default shows custom locator value.
 *
 * #### Examples:
 *
 * Using `data-test` attribute with `$` prefix:
 *
 * ```js
 * // in codecept.conf.js
 * plugins: {
 *  customLocator: {
 *    enabled: true
 *    attribute: 'data-test'
 *  }
 * }
 * ```
 *
 * In a test:
 *
 * ```js
 * I.seeElement('$user'); // matches => [data-test=user]
 * I.click('$sign-up'); // matches => [data-test=sign-up]
 * ```
 *
 * Using `data-qa` attribute with `=` prefix:
 *
 * ```js
 * // in codecept.conf.js
 * plugins: {
 *  customLocator: {
 *    enabled: true
 *    prefix: '=',
 *    attribute: 'data-qa'
 *  }
 * }
 * ```
 *
 * In a test:
 *
 * ```js
 * I.seeElement('=user'); // matches => [data-qa=user]
 * I.click('=sign-up'); // matches => [data-qa=sign-up]
 * ```
 */
module.exports = (config) => {
  config = Object.assign(defaultConfig, config);

  Locator.addFilter((value, locatorObj) => {
    if (typeof value !== 'string') return;
    if (!value.startsWith(config.prefix)) return;

    const val = value.substr(config.prefix.length);

    if (config.strategy.toLowerCase() === 'xpath') {
      locatorObj.value = `.//*[@${config.attribute}=${xpathLocator.literal(val)}]`;
      locatorObj.type = 'xpath';
    }

    if (config.strategy.toLowerCase() === 'css') {
      locatorObj.value = `[${config.attribute}=${val}]`;
      locatorObj.type = 'css';
    }

    if (config.showActual) {
      locatorObj.output = locatorObj.value;
    }
  });
};
