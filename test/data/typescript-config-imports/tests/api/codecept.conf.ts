import { getApiUrl, getTimeout } from '../../common/utils'

export const config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    REST: {
      endpoint: getApiUrl(),
      timeout: getTimeout(),
    }
  },
  bootstrap: null,
  mocha: {},
  name: 'typescript-config-test'
}
