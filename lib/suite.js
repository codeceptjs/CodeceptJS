const chunk = require('./chunk');

/**
 * @param array preferredSuites Format: ['suite1', 'suite2', ...]
 * @param object suites Format: {}
 * @param object config
 *
 * Bootstraps a collection of suites, it combines passed selection of suites to run
 * with the available configuration from config.multiple.
 */
const prepareSuites = (preferredSuites, config) => {
  // reset suites
  let suites = {};

  preferredSuites.forEach((suite) => {
    const [suiteName] = suite.split(':');
    const suiteConfig = config.multiple[suiteName];

    if (!suiteConfig) {
      throw new Error(`Suite ${suiteName} was not configured in "multiple" section of config`);
    }

    suites[suiteName] = { ...suiteConfig, parentSuiteName: suiteName };
  });

  suites = prepareSuitesChunks(preferredSuites, suites, config);
  suites = prepareSuitesBrowsers(preferredSuites, suites, config);
  suites = filterPreferredBrowsers(preferredSuites, suites, config);

  return suites;
};

  /**
   *
   * @param array preferredSuites Format: ['suite1', 'suite2', ...]
   * @param object suites Format: {suite1: {}, suite2: {}, ... }
   * @param object config
   *
   * Expands suites by their (n) via the `chunks` property to multiple suites.
   */
const prepareSuitesChunks = (preferredSuites, suites, config) => {
  Object.entries(suites).forEach((suite) => {
    const [suiteName, suiteConfig] = suite;
    const pattern = suite.tests || config.tests;

    if (!suiteConfig.chunks || !Number.isFinite(suiteConfig.chunks) || !pattern) {
      return;
    }

    delete suites[suiteName];
    chunk.createChunks(suiteConfig, pattern).forEach((suiteChunkConfig, index) => {
      suites[`${suiteName}:chunk${index + 1}`] = suiteChunkConfig;
    });
  });

  return suites;
};

  /**
   *
   * @param array preferredSuites Format: ['suite1', 'suite2', ...]
   * @param object suites Format: {suite1: {}, suite2: {}, ... }
   * @param object config
   *
   * Expands browser declared via `browsers` property to multiple
   * suites that all have one single `browser` property and omits
   * the `browsers` property.
   */
const prepareSuitesBrowsers = (preferredSuites, suites, config) => {
  Object.entries(suites).forEach((suite) => {
    const [suiteName, suiteConfig] = suite;
    const browsers = [];

    delete suites[suiteName];
    suiteConfig.browsers.forEach((browser) => {
      const browserConfig = browser.browser ? browser : { browser };
      const suiteBrowserConfig = { ...suiteConfig, browser: browserConfig };

      browsers.push(browserConfig.browser);
      const count = browsers.filter((b) => {
        return b === browserConfig.browser;
      }).length;

      delete suiteBrowserConfig.browsers;
      suites[`${suiteName}:${browserConfig.browser}${count}`] = suiteBrowserConfig;
    });
  });

  return suites;
};

  /**
   *
   * @param array preferredSuites Format: ['suite1', 'suite2', ...]
   * @param object suites Format: {suite1: {}, suite2: {}, ... }
   * @param object config
   *
   * Filters all suites by their `browser` property. The propoerty `browsers` is ignored.
   * If value of property `browser` does not match the preferred `browser` in conjugation
   * with the preferredSuiteName then the suite is removed from configuration.
   */
const filterPreferredBrowsers = (preferredSuites, suites, config) => {
  preferredSuites.forEach((preferredSuite) => {
    const [preferredSuiteName, preferredSuiteBrowserName] = preferredSuite.split(':');

    preferredSuites.forEach((preferredSuite) => {
      const [preferredSuiteName, preferredSuiteBrowserName] = preferredSuite.split(':');
      Object.entries(suites).forEach((suite) => {
        const [suiteName, suiteConfig] = suite;
        const suiteBrowserName = suiteConfig.browser.browser;

        if (preferredSuiteBrowserName) {
          if (preferredSuiteName === suiteConfig.parentSuiteName && preferredSuiteBrowserName !== suiteBrowserName) {
            delete suites[suiteName];
          }
        }
      });
    });
  });

  return suites;
};

module.exports = {
  prepareSuites,
};
