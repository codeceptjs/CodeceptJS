export const config = {
  tests: './retry_accumulation_test.js',
  output: './output',
  helpers: {
    Playwright: {
      url: 'http://localhost:8000',
      manualStart: true,
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
  name: 'retryAccumulation',
};
