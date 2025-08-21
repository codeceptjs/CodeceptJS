const Helper = require('../../lib/helper')
const fs = require('fs')
const path = require('path')

class FakeDriver extends Helper {
  printBrowser() {
    this.debug(this.config.browser)
  }

  printWindowSize() {
    this.debug(this.config.windowSize)
  }

  wait(seconds) {
    // Simple wait implementation
    return new Promise(resolve => setTimeout(resolve, seconds * 1000))
  }

  see(text) {
    // Always fail to trigger screenshot saving
    throw new Error(`Expected to see "${text}" but this is a fake driver`)
  }

  async saveScreenshot(fileName, fullPage) {
    // Create a fake screenshot (1x1 PNG) for testing purposes
    const fakePngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x37, 0x6e, 0xf9, 0x24, 0x00, 0x00,
      0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xe5, 0x27, 0xde, 0xfc, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ])

    // Ensure directory exists
    const dir = path.dirname(fileName)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Write the fake PNG file
    fs.writeFileSync(fileName, fakePngBuffer)
    this.debug(`Fake screenshot saved to: ${fileName}`)
  }
}

module.exports = FakeDriver
