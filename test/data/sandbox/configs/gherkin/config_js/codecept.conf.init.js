/** @type {CodeceptJS.MainConfig} */
export const config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    Playwright: {
      browser: 'chromium',
      url: 'http://localhost',
      show: true,
    },
  },
  include: {
    I: './steps_file.js',
  },
  name: 'CodeceptJS',
};
