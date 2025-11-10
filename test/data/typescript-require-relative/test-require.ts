// Simple test to check if require wrapper tries extensions
const modulePath = './environments/environment.TEST';
console.log('Testing require wrapper...');

try {
  const env = require(modulePath);
  console.log('SUCCESS: Loaded module without extension:', env);
} catch (err) {
  console.log('FAILED: Could not load module:', err.message);
}
