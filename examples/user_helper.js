const assert = require('assert');
const Helper = require('../lib/helper');

class User extends Helper {
  // before/after hooks
  _before() {
    // remove if not used
  }

  _after() {
    // remove if not used
  }

  // add custom methods here
  // If you need to access other helpers
  // use: this.helpers['helperName']
  seeAuthentication() {
    return this.helpers.WebDriverIO.browser.cookie((err, res) => {
      const cookies = res.value;
      for (const k in cookies) {
        if (cookies[k].name !== 'logged_in') continue;
        assert.toEqual(cookies[k].value, 'yes');
        return;
      }
      assert.fail(cookies, 'logged_in', 'Auth cookie not set');
    });
  }
}

module.exports = User;
