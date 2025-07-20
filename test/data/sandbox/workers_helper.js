import assert from 'assert';
import { isMainThread } from 'worker_threads';

import HelperModule from '@codeceptjs/helper';
const Helper = HelperModule.default || HelperModule;

class Workers extends Helper {
  seeThisIsWorker() {
    assert(!isMainThread, 'this is running inside worker')
  }
}

export default Workers;
