const recorder = require('./recorder');
const container = require('./container');
const event = require('./event');
const output = require('./output');
const store = require('./store');
const { isAsyncFunction } = require('./utils');

const sessionColors = [
  'cyan',
  'blue',
  'red',
  'magenta',
  'yellow',
];

const savedSessions = {};

/**
 * @param {CodeceptJS.LocatorOrString}  sessionName
 * @param {Function | Object<string, *>}  config
 * @param {Function}  [fn]
 * @return {Promise<*> | undefined}
 */
function session(sessionName, config, fn) {
  if (typeof config === 'function') {
    if (typeof fn === 'function') {
      config = config();
    } else {
      // no config but with function
      fn = config;
      config = {};
    }
  }
  // session helpers won't use beforeSuite and afterSuite hooks...
  // restart: false options are not allowed as well
  // but those helpers should be already started so inside listener/helpers.js the `_init` method should already be called

  const helpers = container.helpers();

  if (!savedSessions[sessionName]) {
    for (const helper in helpers) {
      if (!helpers[helper]._session) continue;
      savedSessions[sessionName] = {
        start: () => null,
        stop: () => null,
        loadVars: () => null,
        restoreVars: () => null,
        ...(store.dryRun ? {} : helpers[helper]._session()),
      };
      break;
    }

    const closeBrowsers = () => {
      const session = savedSessions[sessionName];
      if (!session) return;
      session.stop(session.vars);
      delete savedSessions[sessionName];
    };

    event.dispatcher.once(event.test.after, () => {
      recorder.add('close session browsers', closeBrowsers);
    });

    if (!savedSessions[sessionName]) {
      throw new Error('Configured helpers do not support starting sessions. Please use a helper with session support.');
    }

    recorder.add('save vars', async () => {
      savedSessions[sessionName].vars = await savedSessions[sessionName].start(sessionName, config);
    });
  }

  // pick random color
  const color = sessionColors[Object.keys(savedSessions).indexOf(sessionName) % sessionColors.length];

  const addContextToStep = (step) => {
    step.actor = `${output.colors[color](sessionName)}: I`;
  };

  if (!fn) return; // no current session steps

  return recorder.add('register session wrapper', async () => {
    const session = savedSessions[sessionName];
    recorder.session.start(`session:${sessionName}`);
    event.dispatcher.on(event.step.after, addContextToStep);
    recorder.add('switch to browser', () => {
      const session = savedSessions[sessionName];
      return session.loadVars(session.vars);
    });

    const finalize = () => {
      recorder.add('Finalize session', async () => {
        output.stepShift = 0;
        event.dispatcher.removeListener(event.step.after, addContextToStep);
        await session.restoreVars();
        recorder.session.restore(`session:${sessionName}`);
      });
    };

    // Indicate when executing this function that we are in a session
    if (isAsyncFunction(fn)) {
      return fn.apply(null).then((res) => {
        finalize();
        return recorder.promise().then(() => res);
      }).catch((e) => {
        output.stepShift = 0;
        session.restoreVars(sessionName);
        event.dispatcher.removeListener(event.step.after, addContextToStep);
        recorder.throw(e);
        return recorder.promise();
      });
    }

    let res;
    try {
      res = fn.apply(null);
    } catch (err) {
      recorder.throw(err);
    } finally {
      recorder.catch((e) => {
        session.restoreVars(sessionName);
        output.stepShift = 0;
        event.dispatcher.removeListener(event.step.after, addContextToStep);
        throw e;
      });
    }
    finalize();
    return recorder.promise().then(() => res);
  }, false, false);
}

module.exports = session;
