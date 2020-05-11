const event = require('../event');
const recorder = require('../recorder');

module.exports = function () {
  event.dispatcher.on(event.test.before, (test) => {
    test.artifacts = {};
  });

  event.dispatcher.on(event.test.after, test => {
    recorder.add('add artifacts to error stack', () => {
      if (!test.err) return;

      let msg = '';
      if (test.artifacts && Object.keys(test.artifacts).length) {
        msg += '\n\nArtifacts:';
        for (const artifact of Object.keys(test.artifacts)) {
          msg += `\n   - ${artifact}: ${test.artifacts[artifact]}`;
        }
      }

      test.err.stack += msg;
    });
  });
};
