export const config = {
  tests: './bench_test.js',
  output: './output',
  timeout: 30,
  helpers: {
    Obscura: {
      url: process.env.SITE_URL || 'http://127.0.0.1:8000',
    },
  },
  mocha: {},
  name: 'bench-obscura',
}
