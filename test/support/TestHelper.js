class TestHelper {
  static siteUrl() {
    return (process.env.SITE_URL || 'http://localhost:8000');
  }

  static angularSiteUrl() {
    return 'http://davertmik.github.io/angular-demo-app';
  }

  static seleniumAddress() {
    return `http://${this.seleniumHost()}:${this.seleniumPort()}/wd/hub`;
  }

  static seleniumHost() {
    return (process.env.SELENIUM_HOST || 'localhost');
  }

  static seleniumPort() {
    return parseInt(process.env.SELENIUM_PORT || '4444', 10);
  }

  static jsonServerUrl() {
    return (process.env.JSON_SERVER_URL || 'http://localhost:8010');
  }

  static graphQLServerPort() {
    return parseInt(process.env.GRAPHQL_SERVER_PORT || '8020', 10);
  }

  static graphQLServerUrl() {
    return (process.env.GRAPHQL_SERVER_URL || 'http://localhost:8020/graphql');
  }
}

module.exports = TestHelper;
