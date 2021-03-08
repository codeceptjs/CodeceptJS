const { isMainThread, parentPort } = require('worker_threads');

Feature('Should propagate non test events');

Scenario('From worker propagate message 1', ({ I }) => {
  if (!isMainThread) parentPort.postMessage('message 1');
  I.seeThisIsWorker();
});

Scenario('From worker propagate message 2', ({ I }) => {
  if (!isMainThread) parentPort.postMessage('message 2');
  I.seeThisIsWorker();
});
