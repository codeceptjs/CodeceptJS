exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FileSystem: {},
  },
  gherkin: {
    features: './features/*.feature',
    steps: './step_definitions/steps.js',
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox-bdd',
  plugins: {
    htmlReporter: {
      enabled: true,
      output: './output',
      reportFileName: 'bdd-report.html',
      includeArtifacts: true,
      showSteps: true,
      showSkipped: true,
      showMetadata: true,
      showTags: true,
      showRetries: true,
      exportStats: false,
      keepHistory: false,
    },
  },
}