import Helper from '../../../../../lib/helper.js';

class MyHelper extends Helper {
  openPage(url) {
    return this.helpers.FileSystem.amInPath(url);
  }
}

export default MyHelper;
