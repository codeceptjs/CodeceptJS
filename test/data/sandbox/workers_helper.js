import assert from 'assert';
import { isMainThread } from 'worker_threads';
import Helper from '@codeceptjs/helper';

export default class Workers extends Helper {
  seeThisIsWorker() {
    assert(!isMainThread, 'this is running inside worker');
  }
}
