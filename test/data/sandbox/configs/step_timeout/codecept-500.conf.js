exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  plugins: {
    stepTimeout: {
      enabled: true,
      timeout: 0.5,
      noTimeoutSteps: [
        'wait*',
      ],
      customTimeoutSteps: [
        [/^waitTadLonger$/, 0.9],
        ['waitTadShorter', 0.3],
      ],
    },
  },
  name: 'steps',
};
