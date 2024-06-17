const Helper = codecept_helper

const crypto = require('crypto')
const fs = require('fs')

class ScreenshotSessionHelper extends Helper {
  constructor(config) {
    super(config)
    this.outputPath = output_dir
  }

  getSHA256Digests(files = []) {
    const digests = []

    for (const file of files) {
      const hash = crypto.createHash('sha256')
      const data = fs.readFileSync(file)
      hash.update(data)

      digests.push(hash.digest('base64'))
    }

    return digests
  }

  getOutputPath() {
    return this.outputPath
  }
}

module.exports = ScreenshotSessionHelper
