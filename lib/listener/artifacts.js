const event = require('../event');
const recorder = require('../recorder');

/**
 * Create and clean up empty artifacts
 */
module.exports = function () {
  event.dispatcher.on(event.test.before, (test) => {
    test.artifacts = {};
  });

  event.dispatcher.on(event.test.after, (test) => {
    recorder.add('clean up empty artifacts', () => {
      for (const key in (test.artifacts || {})) {
        if (!test.artifacts[key]) delete test.artifacts[key];
      }
    });
  });
};
