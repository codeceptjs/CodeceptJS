console.log('Use JS config file');

console.log(process.env.profile);

exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    WebDriverIO: {
      url: 'http://localhost',
      browser: process.env.profile || 'firefox',
      restart: true,
    },
  },
  mocha: {
    reporterOptions: {
      mochaFile: './output/result.xml',
    },
  },
  name: 'tests',
  bootstrap: './bootstrap.js',
  include: {
    I: './custom_steps.js',
    Smth: './pages/Smth.js',
    loginPage: './pages/Login.js',
    signinFragment: './fragments/Signin.js',
  },
};
