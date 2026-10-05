const port = process.env.WEB_SERVER_PORT

export const config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    FileSystem: {},
  },
  webServer: {
    command: process.env.WEB_SERVER_COMMAND || 'node server.js',
    url: `http://127.0.0.1:${port}`,
    enabled: process.env.WEB_SERVER_ENABLED !== 'false',
    timeout: Number(process.env.WEB_SERVER_TIMEOUT || 10000),
  },
  multiple: {
    default: {
      browsers: ['chrome', 'firefox'],
    },
  },
  name: 'webServer',
}
