const fs = require('fs');
const path = require('path');
const { fileExists } = require('../utils');
const container = require('../container');
const store = require('../store');
const recorder = require('../recorder');
const debug = require('../output').debug;

const defaultUser = {
  fetch: I => I.grabCookie(),
  restore: (I, cookies) => {
    I.amOnPage('/'); // open a page
    I.setCookie(cookies);
  },
};

const defaultConfig = {
  saveToFile: false,
  inject: 'login',
};

/**
 * Logs user in for the first test and reuses session for next tests.
 * Works by saving cookies into memory or file.
 * If a session expires automatically logs in again.
 *
 * > For better development experience cookies can be saved into file, so a session can be reused while writing tests.
 *
 * #### Usage
 *
 * 1. Enable this plugin and configure as described below
 * 2. Define user session names (example: `user`, `editor`, `admin`, etc).
 * 3. Define how users are logged in and how to check that user is logged in
 * 4. Use `login` object inside your tests to log in:
 *
 * ```js
 * // inside a test file
 * // use login to inject auto-login function
 * Before(login => {
 *    login('user'); // login using user session
 * });
 *
 * // Alternatively log in for one scenario
 * Scenario('log me in', (I, login) => {
 *    login('admin');
 *    I.see('I am logged in');
 * });
 * ```
 *
 * #### Configuration
 *
 * * `saveToFile` (default: false) - save cookies to file. Allows to reuse session between execution.
 * * `inject` (default: `login`) - name of the login function to use
 * * `users` - an array containing different session names and functions to:
 *    * `login` - sign in into the system
 *     * `check` - check that user is logged in
 *     * `fetch` - to get current cookies (by default `I.grabCookie()`)
 *     * `load` - to set cookies (by default `I.setCookie(cookie)`)
 *
 *
 * #### Example: Simple login
 *
 * ```js
 * autoLogin: {
 *   enabled: true,
 *   saveToFile: true,
 *   inject: 'login',
 *   users: {
 *     admin: {
 *       // loginAdmin function is defined in `steps_file.js`
 *       login: (I) => I.loginAdmin(),
 *       // if we see `Admin` on page, we assume we are logged in
 *       check: (I) => I.see('Admin'),
 *       // we take all cookies from a browser
 *       fetch: I => I.grabCookie(),
 *       // we set all available cookies to restore session
 *       restore: (I, cookie) => I.setCookie(cookie)
 *     }
 *   }
 * }
 * ```
 *
 * #### Example: Multiple users
 *
 * ```js
 * autoLogin: {
 *   enabled: true,
 *   saveToFile: true,
 *   inject: 'loginAs', // use `loginAs` instead of login
 *   users: {
 *     user: {
 *       login: (I) => {
 *          I.amOnPage('/login');
 *          I.fillField('email', 'user@site.com');
 *          I.fillField('password', '123456');
 *          I.click('Login');
 *       }
 *       check: (I) => I.see('User', '.navbar'),
 *     },
 *     admin: {
  *       login: (I) => {
  *          I.amOnPage('/login');
  *          I.fillField('email', 'admin@site.com');
  *          I.fillField('password', '123456');
  *          I.click('Login');
  *       }
  *       check: (I) => I.see('Admin', '.navbar'),
  *     },
 *   }
 * }
 * ```
 *
 * #### Example: Keep cookies between tests
 *
 * If you decide to keep cookies between tests you don't need to save/retrieve cookies between tests.
 * But you need to login once work until session expires.
 * For this case, disable `fetch` and `restore` methods.
 *
 * ```js
 * helpers: {
 *    WebDriver: {
 *      // config goes here
 *      keepCookies: true; // keep cookies for all tests
 *    }
 * },
 * plugins: {
 *    autoLogin: {
 *     admin: {
 *       login: (I) => {
 *          I.amOnPage('/login');
 *          I.fillField('email', 'admin@site.com');
 *          I.fillField('password', '123456');
 *          I.click('Login');
 *       }
 *       check: (I) => I.see('Admin', '.navbar'),
 *       fetch: () => {}, // empty function
 *       restore: () => {}, // empty funciton
 *     }
 *   }
 * }
 * ```
 *
*/
module.exports = function (config) {
  config = Object.assign(defaultConfig, config);
  Object.keys(config.users).map(u => config.users[u] = Object.assign({}, defaultUser, config.users[u]));

  if (config.saveToFile) {
    // loading from file
    for (const name in config.users) {
      const fileName = path.join(global.output_dir, `${name}_session.json`);
      if (!fileExists(fileName)) continue;
      const data = fs.readFileSync(fileName).toString();
      try {
        store[`${name}_session`] = JSON.parse(data);
      } catch (err) {
        throw new Error(`Could not load session from ${fileName}\n${err}`);
      }
      debug(`Loaded user session for ${name}`);
    }
  }

  const loginFunction = async (name) => {
    const userSession = config.users[name];
    const I = container.support('I');
    const cookies = store[`${name}_session`];

    const loginAndSave = async () => {
      userSession.login(I);
      store.debugMode = true;
      const cookies = await userSession.fetch(I);
      if (config.saveToFile) {
        debug(`Saved user session into file for ${name}`);
        fs.writeFileSync(path.join(global.output_dir, `${name}_session.json`), JSON.stringify(cookies));
      }
      store[`${name}_session`] = cookies;
      store.debugMode = false;
    };

    if (!cookies) return loginAndSave();

    store.debugMode = true;

    recorder.session.start('check login');
    userSession.restore(I, cookies);
    userSession.check(I);
    recorder.session.catch(() => {
      debug(`Failed auto login for ${name}, logging in again`);
      recorder.session.start('auto login');
      return loginAndSave().then(() => {
        recorder.add(() => recorder.session.restore('auto login'));
        recorder.catch(err => debug('continue'));
      }).catch((err) => {
        recorder.session.restore('auto login');
        recorder.session.restore('check login');
        recorder.throw(err);
      });
    });
    recorder.add(() => {
      store.debugMode = false;
      recorder.session.restore('check login');
    });

    return recorder.promise();
  };

  // adding this to DI container
  const support = {};
  support[config.inject] = loginFunction;
  container.append({ support });
};
