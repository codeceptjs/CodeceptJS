const recorder = require('./recorder');
const container = require('./container');
const event = require('./event');
const output = require('./output');
const { getParamNames, isGenerator, isAsyncFunction } = require('./utils');
const resumeTest = require('./scenario').resumeTest;

const sessionColors = [
  'cyan',
  'blue',
  'red',
  'magenta',
  'yellow',
];

const savedSessions = {};

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
      savedSessions[sessionName] = Object.assign({
        start: () => null,
        stop: () => null,
        loadVars: () => null,
        restoreVars: () => null,
      }, helpers[helper]._session());
      break;
    }

    if (!savedSessions[sessionName]) {
      throw new Error('Configured helpers do not support starting sessions. Please use a helper with session support.');
    }

    recorder.add(`stop session ${sessionName}`, () => savedSessions[sessionName].vars = savedSessions[sessionName].start(config));

    event.dispatcher.once(event.test.after, () => {
      const session = savedSessions[sessionName];
      delete savedSessions[sessionName];
      recorder.add(`stop session ${sessionName}`, () => {
        return session.stop();
      });
    });
  }

  const color = sessionColors[Object.keys(savedSessions).indexOf(sessionName) % sessionColors.length];

  const addContextToStep = (step) => {
    step.actor = `${output.colors[color](sessionName)}: I`;
  };

  if (!fn) return; // no current session steps

  recorder.add('register session wrapper', () => {
    const session = savedSessions[sessionName];
    session.loadVars(session.vars);
    recorder.session.start(`session:${sessionName}`);
    event.dispatcher.on(event.step.after, addContextToStep);
    // replace helper in container
    // output.stepShift = 2;
    // if (output.level() > 0) output.print(`\n   ${output.colors.cyan.bold(`Session "${sessionName}"`)}:`);

    const finalize = () => {
      recorder.add('Finalize session', () => {
        // output.print(`   ${output.colors.cyan.bold('_______')}\n`);
        output.stepShift = 0;
        event.dispatcher.removeListener(event.step.after, addContextToStep);
        session.restoreVars();
        recorder.session.restore(`session:${sessionName}`);
      });
    };

    if (isAsyncFunction(fn)) {
      return fn.apply(null, args).then(() => {
        finalize();
        return recorder.promise();
      }).catch((e) => {
        finalize();
        recorder.throw(e);
      });
    }


    try {
      const res = fn.apply(null, args);
      if (isGenerator(fn)) {
        try {
          res.next();
        } catch (err) {
          recorder.throw(err);
        }
        recorder.catch((err) => {
          event.dispatcher.removeListener(event.step.after, addContextToStep);
          output.stepShift = 0;
          throw err;
        }); // catching possible errors in promises
        resumeTest(res, () => {
        }, (err) => {
          event.dispatcher.removeListener(event.step.after, addContextToStep);
          output.stepShift = 0;
          throw err;
        }, true);
      }
    } catch (err) {
      recorder.throw(err);
    } finally {
      if (!isGenerator(fn)) {
        recorder.catch((err) => {
          event.dispatcher.removeListener(event.step.after, addContextToStep);
          output.stepShift = 0;
          throw err;
        });
      }
    }
    finalize();
    return recorder.promise();
  });
}


module.exports = session;
