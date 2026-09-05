export const config = {
  tests: './bench_test.js',
  output: './output',
  timeout: 30,
  helpers: {
    Playwright: {
      url: process.env.SITE_URL || 'http://127.0.0.1:8000',
      show: false,
      restart: false,
      browser: 'chromium',
      chromium: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      },
    },
  },
  mocha: {},
  name: 'bench-playwright',
}
