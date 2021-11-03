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
      timeout: 1,
      force: true,
      noTimeoutSteps: [
        'wait*',
      ],
      customTimeoutSteps: [
        [/^waitTadLonger$/, 1.5],
        ['waitTadShorter', 0.5],
      ],
    },
  },
  name: 'steps',
};
