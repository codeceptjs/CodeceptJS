const { useHeadlessWhen, useSharedCookies } = require('@codeceptjs/config-hooks');

useHeadlessWhen(process.env.headless);
useSharedCookies();
useWindowSize(1600, 1000);

exports.config = {
  output: './output',
  helpers: {
    Puppeteer: {
      url: 'http://localhost',
      browser: 'chrome',
      restart: false,
      windowSize: '1600x1200',
      show: false,
    },
    REST: {},
  },
  include: {
    I: './custom_steps.js',
    Smth: './pages/Smth.js',
    loginPage: './pages/Login.js',
    signinFragment: './fragments/Signin.js',
  },
  mocha: {
    reporterOptions: {
      mochaFile: './output/result.xml',
    },
  },
  bootstrap: './bootstrap.js',
  teardown: null,
  hooks: [],
  gherkin: {
    features: './features/*.feature',
    steps: [
      './step_definitions/steps.js',
    ],
  },
  plugins: {
    allure: {
      enabled: false,
    },
    wdio: {
      enabled: false,
      services: [
        'selenium-standalone',
      ],
    },
    stepByStepReport: {},
    autoDelay: {
      enabled: false,
    },
    retryFailedStep: {
      enabled: true,
    },
  },
  tests: './*_test.js',
  timeout: 10000,
  multiple: {
    parallel: {
      chunks: 2,
    },
    default: {
      grep: 'signin',
      browsers: [
        'chrome',
        'firefox',
      ],
    },
  },
  name: 'tests',
};
