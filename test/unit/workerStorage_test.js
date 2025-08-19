const { expect } = require('expect');
const WorkerStorage = require('../../lib/workerStorage');
const { Worker } = require('worker_threads');
const event = require('../../lib/event');

describe('WorkerStorage', () => {
  it('should handle share message correctly without circular dependency', (done) => {
    // Create a mock worker to test the functionality
    const mockWorker = {
      threadId: 'test-thread-1',
      on: (eventName, callback) => {
        if (eventName === 'message') {
          // Simulate receiving a share message
          setTimeout(() => {
            callback({ event: 'share', data: { testKey: 'testValue' } });
            done();
          }, 10);
        }
      },
      postMessage: () => {}
    };

    // Add the mock worker to storage
    WorkerStorage.addWorker(mockWorker);
  });

  it('should not crash when sharing data', () => {
    const testData = { user: 'test', password: '123' };
    
    // This should not throw an error
    expect(() => {
      WorkerStorage.share(testData);
    }).not.toThrow();
  });
});
