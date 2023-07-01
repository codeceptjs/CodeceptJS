const Container = require('../container');
const recorder = require('../recorder');
const event = require('../event');
const supportedHelpers = require('./standardActingHelpers');
const { scanForErrorMessages } = require('../html');
const { output } = require('..');

/**
 * Creates screenshot on failure. Screenshot is saved into `output` directory.
 *
 * Initially this functionality was part of corresponding helper but has been moved into plugin since 1.4
 *
 * This plugin is **enabled by default**.
 *
 *
 */
module.exports = function (config) {
  const helpers = Container.helpers();
  let helper;

  for (const helperName of supportedHelpers) {
    if (Object.keys(helpers).indexOf(helperName) > -1) {
      helper = helpers[helperName];
    }
  }

  if (!helper) return; // no helpers for screenshot

  event.dispatcher.on(event.test.failed, (test) => {
    recorder.add('HTML snapshot failed test', async () => {
      try {
        const currentOutputLevel = output.level();
        output.level(0);
        const html = await helper.grabHTMLFrom('body');
        output.level(currentOutputLevel);

        if (!html) return;

        const errors = scanForErrorMessages(html);
        if (errors.length) {
          output.debug('Detected errors in HTML code');
          errors.forEach((error) => output.debug(error));
          test.artifacts.errors = errors;
        }
      } catch (err) {
        // not really needed
      }
    });
  });
};
