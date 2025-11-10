import { getConfig } from '../../common/utils';

const apiConfig = getConfig();

export const config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    REST: {
      endpoint: apiConfig.endpoint,
      timeout: apiConfig.timeout
    }
  },
  name: 'typescript-directory-import-test'
};
