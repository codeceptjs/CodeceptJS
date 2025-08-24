exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: false,
  plugins: {
    htmlReporter: {
      enabled: true,
      output: './output',
      reportFileName: 'report.html',
      includeArtifacts: true,
      showSteps: true,
      showSkipped: true,
    },
  },
  mocha: {},
  name: 'html-reporter-plugin tests',
}