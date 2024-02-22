import assert from 'assert';
import { isMainThread } from 'worker_threads';

export default class Workers {
  seeThisIsWorker() {
    assert(!isMainThread, 'this is running inside worker');
  }
}
