export const config = {
  tests: './retry_multiple_scenarios_test.js',
  output: './output',
  helpers: {
    Playwright: {
      url: 'http://localhost:8000',
      show: false,
      restart: false,
    },
    AccumulationHelper: {
      require: './helper.accumulation.js',
    },
  },
  plugins: {
    retryFailedStep: {
      enabled: true,
      retries: 2,
    },
  },
  bootstrap: null,
  mocha: {},
  name: 'retryMultipleScenarios',
};
