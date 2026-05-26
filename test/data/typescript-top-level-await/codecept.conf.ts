import { E2EEnvironment } from './environments';

// Use top-level await in codecept.conf.ts
const environment = await E2EEnvironment;

export const config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    REST: {
      endpoint: environment.url,
      timeout: environment.timeout
    }
  },
  name: 'typescript-top-level-await-test'
};
