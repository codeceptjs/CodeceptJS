exports.config = {
  tests: './*_no_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    BDD: {
      require: './support/bdd_helper.js',
    },
  },
  gherkin: {
    features: './features/*.feature',
    steps: [
      './features/step_definitions/my_steps.js',
      './features/step_definitions/my_other_steps.js',
    ],
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
};
