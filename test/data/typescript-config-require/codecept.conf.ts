export const config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    REST: {
      endpoint: 'https://api.example.com',
    }
  },
  plugins: {
    allure: {
      enabled: false,
      require: '@codeceptjs/allure-legacy',
    },
    htmlReporter: {
      enabled: true,
      keepHistory: true,
    }
  },
  bootstrap: null,
  mocha: {},
  name: 'typescript-config-with-require'
}
