import Helper from '../../../../../lib/helper.js';

class MyHelperTs extends Helper {
  openPageTs(url: string): Promise<void> {
    return this.helpers.FileSystem.amInPath(url);
  }
}

export default MyHelperTs;
