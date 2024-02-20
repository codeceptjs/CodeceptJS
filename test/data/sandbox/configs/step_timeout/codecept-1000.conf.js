export const config = {
  tests: './*_test.js',
  output: './output.js',
  helpers: {
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  plugins: {
    stepTimeout: {
      enabled: true,
      timeout: 1,
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
