exports.config = {
    tests: './*_test.stale.js',
    // timeout: 10000,
    retry: {
      Scenario: 2,
      After: 0,
      Before: 1,
    },
    output: './output',
    helpers: {
    },
    include: {},
    bootstrap: false,
    mocha: {},
    name: 'sandbox',
  };
  