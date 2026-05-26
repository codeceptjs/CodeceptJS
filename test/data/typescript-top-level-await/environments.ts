// Test top-level await in TypeScript
let env = process.env.E2E_ENV || "TEST";

if (process.env.PROD === 'true') {
    env = 'PROD';
}

async function loadEnvironment() {
  const environmentPath = `./environments/environment.${env}.js`;
  const environmentModule = await import(environmentPath);
  const environment = environmentModule.default || environmentModule;

  environment.url = process.env.E2E_URL || environment.url;

  if (environment.url.endsWith("/")) {
      environment.url = environment.url.slice(0, -1);
  }

  if (!environment.urlApi) {
      environment.urlApi = `${environment.url}/api`;
  }

  environment.outputDir = `./../reports/e2e/results/`;
  environment.env = env;

  console.log(`Parsed E2E environment:`, environment);
  
  return environment;
}

export const E2EEnvironment = loadEnvironment();
