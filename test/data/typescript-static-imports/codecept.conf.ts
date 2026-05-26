import { E2EEnvironment } from './environments.js';

export const config = {
  tests: './*_test.ts',
  output: './output',
  require: ['tsx/cjs'],  // Enable TypeScript loader for test files (CommonJS hooks)
  helpers: {
    CustomHelper: {
      require: '../helper.js'
    }
  },
  name: 'typescript-static-imports-test'
};
