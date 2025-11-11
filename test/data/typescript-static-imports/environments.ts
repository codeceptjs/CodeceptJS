import envTEST from './common/environment.TEST.js';

const env = process.env.E2E_ENV || "TEST";

const environments = {
  TEST: envTEST
};

const environment = environments[env];

console.log(`Loaded environment:`, environment);

export const E2EEnvironment = environment;
