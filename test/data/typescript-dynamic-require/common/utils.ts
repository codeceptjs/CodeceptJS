// Simulate the user's scenario
let env: string = process.env.E2E_ENV || "TEST";

// Use path relative to this file's location  
// Add .cjs extension since we're in an ESM project (package.json has "type": "module")
const environmentPath: string = `../config/environment.${env}.cjs`;
const environment = require(environmentPath);

export const Environment = environment;
