const { isMainThread, parentPort } = require('worker_threads');

const workerObjects = {};
const shareEvent = 'share';

const invokeWorkerListeners = (workerObj) => {
  const { threadId } = workerObj;
  workerObj.on('message', (messageData) => {
    if (messageData.event === shareEvent) {
      share(messageData.data);
    }
  });
  workerObj.on('exit', () => {
    delete workerObjects[threadId];
  });
};

class WorkerStorage {
  /**
   * Add worker object
   *
   * @api
   * @param {Worker} workerObj
   */
  static addWorker(workerObj) {
    workerObjects[workerObj.threadId] = workerObj;
    invokeWorkerListeners(workerObj);
  }

  /**
   * Share data across workers
   *
   * @param {*} data
   */
  static share(data) {
    if (isMainThread) {
      for (const workerObj of Object.values(workerObjects)) {
        workerObj.postMessage({ data });
      }
    } else {
      parentPort.postMessage({ data, event: shareEvent });
    }
  }
}

module.exports = WorkerStorage;
