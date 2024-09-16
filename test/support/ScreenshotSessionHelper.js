const Helper = codecept_helper

const crypto = require('crypto')
const fs = require('fs').promises

class ScreenshotSessionHelper extends Helper {
  constructor(config) {
    super(config)
    this.outputPath = output_dir
  }

  async getSHA256Digests(files = []) {
    if (!Array.isArray(files)) {
      throw new TypeError('Expected an array of file paths');
    }

    const digests = [];

    for (const file of files) {
      try {
        const data = await fs.readFile(file)
        const hash = crypto.createHash('sha256')
        hash.update(data)
        digests.push(hash.digest('base64'))
      } catch (error) {
        console.error(`Error processing file ${file}:`, error.message)
        digests.push(null) // Add null or handle it as you need for failed files
      }
    }

    return digests
  }

  getOutputPath() {
    return this.outputPath
  }
}

module.exports = ScreenshotSessionHelper
