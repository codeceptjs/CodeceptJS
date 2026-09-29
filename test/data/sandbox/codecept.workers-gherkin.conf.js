export const config = {
  tests: './workers-gherkin/_placeholder.js',
  timeout: 10000,
  output: './output',
  helpers: {
    BDD: {
      require: './support/bdd_helper.js',
    },
    Workers: {
      require: './workers_helper.js',
    },
  },
  gherkin: {
    features: './workers-gherkin/*.feature',
    steps: ['./workers-gherkin/steps.js'],
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox-workers-gherkin',
}
