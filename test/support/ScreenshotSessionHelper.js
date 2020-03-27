const Helper = codecept_helper;

const crypto = require('crypto');
const fs = require('fs');

class ScreenshotSessionHelper extends Helper {
  _finishTest() {
    // Cleanup screenshots created by session screenshot test
    const screenshotDir = fs.readdirSync(this.outputPath, { withFileTypes: true })
      .filter(item => item.isFile() && item.name.includes('session'));

    screenshotDir.forEach(file => fs.unlinkSync(`${this.outputPath}/${file.name}`));
  }

  constructor(config) {
    super(config);
    this.outputPath = config.outputPath;
  }

  getMD5Digests(files = []) {
    const digests = [];

    for (const file of files) {
      const hash = crypto.createHash('md5');
      const data = fs.readFileSync(file);
      hash.update(data);

      digests.push(hash.digest('base64'));
    }

    return digests;
  }

  getOutputPath() {
    return this.outputPath;
  }
}

module.exports = ScreenshotSessionHelper;
