import { E2EEnvironment } from './environments';

export const config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    REST: {
      endpoint: E2EEnvironment.url,
      timeout: E2EEnvironment.timeout
    }
  },
  name: 'typescript-require-relative-test'
};
