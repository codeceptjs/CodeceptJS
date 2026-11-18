export const config = {
  tests: './bench_test.js',
  output: './output',
  timeout: 30,
  helpers: {
    Kitesurf: {
      url: process.env.SITE_URL || 'http://127.0.0.1:8000',
      endpoint: process.env.KITESURF_ENDPOINT || 'http://127.0.0.1:8787',
    },
  },
  mocha: {},
  name: 'bench-kitesurf',
}
