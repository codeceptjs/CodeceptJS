class TestHelper {
  static siteUrl() {
    return (process.env.SITE_URL || '127.0.0.1:8000')
  }

  static seleniumAddress() {
    return `http://${this.seleniumHost()}:${this.seleniumPort()}/wd/hub`
  }

  static seleniumHost() {
    return (process.env.SELENIUM_HOST || '127.0.0.1')
  }

  static seleniumPort() {
    return (process.env.SELENIUM_PORT || '4444')
  }
}

module.exports = TestHelper;
