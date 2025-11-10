import { Environment } from '../common/utils'

export const config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    REST: {
      endpoint: Environment.apiUrl,
    }
  },
  bootstrap: null,
  mocha: {},
  name: 'typescript-dynamic-require-test'
}
