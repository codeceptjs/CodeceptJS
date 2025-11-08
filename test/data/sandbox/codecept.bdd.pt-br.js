export const config = {
  tests: './*_no_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    BDD: {
      require: './support/bdd_helper.js',
    },
  },
  gherkin: {
    features: './i18n/features/examples.pt-br.feature',
    steps: ['./i18n/features/step_definitions/my_steps.pt-br.js'],
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox',
  translation: 'pt-BR',
}
