class TestHelper {
  static siteUrl() {
    return (process.env.SITE_URL || 'http://localhost:8000');
  }

  static seleniumAddress() {
    return `http://${this.seleniumHost()}:${this.seleniumPort()}/wd/hub`;
  }

  static seleniumHost() {
    return (process.env.SELENIUM_HOST || 'localhost');
  }

  static seleniumPort() {
    return (process.env.SELENIUM_PORT || '4444');
  }

  static jsonServerUrl() {
    return (process.env.JSON_SERVER_URL || 'http://localhost:8010');
  }
}

module.exports = TestHelper;
