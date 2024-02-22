import { isMainThread, parentPort } from 'worker_threads';

const workerObjects = {};
const shareEvent = 'share';

export const invokeWorkerListeners = (workerObj) => {
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

/**
 * Add worker object
 *
 * @api
 * @param {Worker} workerObj
 */
export function addWorker(workerObj) {
  // @ts-ignore
  workerObjects[workerObj.threadId] = workerObj;
  invokeWorkerListeners(workerObj);
}

/**
 * Share data across workers
 *
 * @param {*} data
 */
export function share(data) {
  if (isMainThread) {
    for (const workerObj of Object.values(workerObjects)) {
      workerObj.postMessage({ data });
    }
  } else {
    // @ts-ignore
    parentPort.postMessage({ data, event: shareEvent });
  }
}
