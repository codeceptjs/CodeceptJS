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
    features: './features/examples.pt-br.feature',
    steps: ['./features/step_definitions/my_steps.pt-br.js'],
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
  translation: 'pt-BR',
}
