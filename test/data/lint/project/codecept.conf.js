export const config = {
  tests: './*_test.js',
  include: {
    I: './steps_file.js',
    loginPage: './pages/login.js',
    externalModule: 'some-package',
  },
  helpers: {
    Custom: {
      require: './custom_helper.js',
    },
  },
  lint: {
    rules: { 'raw-browser-in-test': 'off' },
  },
}
