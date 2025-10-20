const assert = require('assert');

class User extends Helper {
  _beforeSuite() {
  }

  _before() {
    this.i = 0;
  }

  failNTimes(n) {
    this.i++;
    // this.i++;
    console.log(this.i, n);
    if (this.i < n) throw new Error('ups, error');
  }

  // add custom methods here
  // If you need to access other helpers
  // use: this.helpers['helperName']
  seeAuthentication() {
    return this.helpers.WebDriverIO.browser.cookie((err, res) => {
      const cookies = res.value;
      for (const k in cookies) {
        if (cookies[k].name !== 'logged_in') continue;
        assert.equal(cookies[k].value, 'yes');
        return;
      }
      assert.fail(cookies, 'logged_in', 'Auth cookie not set');
    });
  }
}

module.exports = User;
