exports.config = {
    tests: './test.scenario-stale.js',
    timeout: 10000,
    retry: 2,
    output: './output',
    include: {},
    bootstrap: false,
    mocha: {},
    name: 'sandbox'
  };
  