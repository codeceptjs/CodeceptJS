const fs = require('fs');
const path = require('path');
const { fileExists } = require('../utils');
const container = require('../container');
const store = require('../store');
const recorder = require('../recorder');
const { debug } = require('../output');
const isAsyncFunction = require('../utils').isAsyncFunction;

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
 *     * `restore` - to set cookies (by default `I.amOnPage('/'); I.setCookie(cookie)`)
 *
 * #### How It Works
 *
 * 1. `restore` method is executed. It should open a page and set credentials.
 * 2. `check` method is executed. It should reload a page (so cookies are applied) and check that this page belongs to logged in user.
 * 3. If `restore` and `check` were not successful, `login` is executed
 * 4. `login` should fill in login form
 * 5. After successful login, `fetch` is executed to save cookies into memory or file.
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
 *       check: (I) => {
 *          I.amOnPage('/');
 *          I.see('Admin');
 *       }
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
 *       },
 *       check: (I) => {
 *          I.amOnPage('/');
 *          I.see('User', '.navbar');
 *       },
 *     },
 *     admin: {
 *       login: (I) => {
 *          I.amOnPage('/login');
 *          I.fillField('email', 'admin@site.com');
 *          I.fillField('password', '123456');
 *          I.click('Login');
 *       },
 *       check: (I) => {
 *          I.amOnPage('/');
 *          I.see('Admin', '.navbar');
 *       },
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
 *      users: {
 *        admin: {
 *          login: (I) => {
 *            I.amOnPage('/login');
 *            I.fillField('email', 'admin@site.com');
 *            I.fillField('password', '123456');
 *            I.click('Login');
 *          },
 *          check: (I) => {
 *            I.amOnPage('/dashboard');
 *            I.see('Admin', '.navbar');
 *          },
 *          fetch: () => {}, // empty function
 *          restore: () => {}, // empty funciton
 *        }
 *     }
 *   }
 * }
 * ```
 *
 * #### Example: Getting sessions from local storage
 *
 * If your session is stored in local storage instead of cookies you still can obtain sessions.
 *
 * ```js
 * plugins: {
 *    autoLogin: {
 *     admin: {
 *       login: (I) => I.loginAsAdmin(),
 *       check: (I) => I.see('Admin', '.navbar'),
 *       fetch: (I) => {
 *         return I.executeScript(() => localStorage.getItem('session_id'));
 *       },
 *       restore: (I, session) => {
 *         I.amOnPage('/');
 *         I.executeScript((session) => localStorage.setItem('session_id', session), session);
 *       },
 *     }
 *   }
 * }
 * ```
 *
 * #### Tips: Using async function in the autoLogin
 *
 * If you use async functions in the autoLogin plugin, login function should be used with `await` keyword.
 *
 * ```js
 * autoLogin: {
 *   enabled: true,
 *   saveToFile: true,
 *   inject: 'login',
 *   users: {
 *     admin: {
 *       login: async (I) => {  // If you use async function in the autoLogin plugin
 *          const phrase = await I.grabTextFrom('#phrase')
 *          I.fillField('username', 'admin'),
 *          I.fillField('password', 'password')
 *          I.fillField('phrase', phrase)
 *       },
 *       check: (I) => {
 *          I.amOnPage('/');
 *          I.see('Admin');
 *       },
 *     }
 *   }
 * }
 * ```
 *
 * ```js
 * Scenario('login', async (I, login) => {
 *   await login('admin') // you should use `await`
 * })
 * ```
 *
 *
 *
*/
module.exports = function (config) {
  config = Object.assign(defaultConfig, config);
  Object.keys(config.users).map(u => config.users[u] = {
    ...defaultUser,
    ...config.users[u],
  });

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
    const shouldAwait = isAsyncFunction(userSession.login)
      || isAsyncFunction(userSession.restore)
      || isAsyncFunction(userSession.check);

    const loginAndSave = async () => {
      if (shouldAwait) {
        await userSession.login(I);
      } else {
        userSession.login(I);
      }
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
    if (shouldAwait) {
      await userSession.restore(I, cookies);
      await userSession.check(I);
    } else {
      userSession.restore(I, cookies);
      userSession.check(I);
    }
    recorder.session.catch((err) => {
      debug(`Failed auto login for ${name} due to ${err}`);
      debug('Logging in again');
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
