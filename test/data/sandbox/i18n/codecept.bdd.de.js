exports.config = {
  tests: './*_no_test.js',
  timeout: 10000,
  output: '../output',
  helpers: {
    BDD: {
      require: '../support/bdd_helper.js',
    },
  },
  gherkin: {
    features: './features/examples.de.feature',
    steps: [
      './features/step_definitions/my_steps.de.js',
    ],
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
  translation: 'de-DE',
};
