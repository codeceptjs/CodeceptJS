const { spawn } = require('child_process');
const http = require('http');

const PORT = process.env.PORT || 3001;
const MAX_RETRIES = 20;
const RETRY_DELAY = 500;

function waitForServer(retries = 0) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}/api/users`, res => {
      if (res.statusCode === 200) return resolve(true);
      res.resume();
      reject();
    }).on('error', () => {
      if (retries < MAX_RETRIES) {
        setTimeout(() => {
          resolve(waitForServer(retries + 1));
        }, RETRY_DELAY);
      } else {
        reject(new Error('Mock server did not start in time'));
      }
    });
  });
}

const serverProcess = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env,
});

console.log('Starting mock server...');
waitForServer()
  .then(() => {
    console.log('Mock server is up and running!');
  })
  .catch(err => {
    console.error(err.message);
    serverProcess.kill();
    process.exit(1);
  });
