exports.config = {
    tests: './test.scenario-stale.js',
    timeout: 10000,
    retry: {
      Scenario: 2,
      After: 0,
      Before: 1,
    },
    output: './output',
    helpers: {
      Playwright: {
        url: 'http://localhost',
        show: false,
        browser: 'chromium',
      },
    },
    include: {},
    bootstrap: false,
    mocha: {},
    name: 'sandbox'
  };
  