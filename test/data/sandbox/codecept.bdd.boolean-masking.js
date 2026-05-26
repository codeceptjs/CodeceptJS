exports.config = {
  tests: './*_no_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    BDD: {
      require: './support/bdd_helper.js',
    },
  },
  // Traditional boolean masking configuration
  maskSensitiveData: true,
  gherkin: {
    features: './features/secret.feature',
    steps: ['./features/step_definitions/my_steps.js', './features/step_definitions/my_other_steps.js'],
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox-boolean-masking',
}
