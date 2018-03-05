let event;
try {
  require.resolve('../../../lib');
  event = require('../../../lib').event;
} catch (err) {
  event = require('/codecept/lib').event; // eslint-disable-line
}

const eventTypes = [
  // All Events
  event.all.before,
  event.all.result,
  event.all.after,

  // Suite events
  event.suite.before,
  event.suite.after,

  // Test events
  event.test.before,
  event.test.started,
  event.test.passed,
  event.test.failed,
  event.test.after,
];

let eventRecorder = [];
let eventTypeCounter = {};
const options = {
  logToConsole: false,
};

const newEventHandler = (name) => {
  event.dispatcher.on(name, () => {
    eventRecorder.push(name);
    eventTypeCounter[name] = (eventTypeCounter[name] || 0) + 1;
    if (options.logToConsole) {
      console.log(`Event:${name}`);
    }
  });
};

eventTypes.forEach(name => newEventHandler(name));

module.exports = {
  events: eventRecorder,
  counter: eventTypeCounter,
  clearEvents: () => {
    eventRecorder = [];
    eventTypeCounter = {};
  },
  setConsoleLogging: on => options.logToConsole = !!on,
};
