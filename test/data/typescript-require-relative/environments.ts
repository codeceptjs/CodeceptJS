// Load environment configuration
let env = process.env.E2E_ENV || "TEST";

if (process.env.PROD === 'true') {
    env = 'PROD';
}

const environmentPath = `./environments/environment.${env}`;
// Using require to load the file dynamically
const environment = require(environmentPath);

environment.url = process.env.E2E_URL || environment.url;

if (environment.url.endsWith("/")) {
    // Remove tailing slash, since it would lead to problems with further configuration.
    environment.url = environment.url.slice(0, -1);
}

// Setting default values on optional fields.
if (!environment.urlApi) {
    environment.urlApi = `${environment.url}/api`;
}

// Parse additional environment configurations.
const environmentParsed = environment;
environmentParsed.outputDir = `./../reports/e2e/results/`;
environmentParsed.env = env;

// There is no other logger in the E2E environment.
console.log(`Parsed E2E environment:`, environmentParsed);

export const E2EEnvironment = environmentParsed;
