const Container = require('../container');
const recorder = require('../recorder');
const event = require('../event');
const output = require('../output');
const fs = require('fs');
const path = require('path');
const { clearString } = require('../utils');

const defaultConfig = {
  uniqueScreenshotNames: false,
  disableScreenshots: false,
  fullPageScreenshots: false,
};

const supportedHelpers = [
  'WebDriverIO',
  'Protractor',
  'Appium',
  'Nightmare',
  'Puppeteer',
];

/**
 * Creates screenshot on failure. Screenshot is saved into `output` directory.
 *
 * Initially this functionality was part of corresponding helper but has been moved into plugin since 1.4
 *
 * This plugin is **enabled by default**.
 *
 * #### Configuration
 *
 * Configuration can either be taken from a corresponding helper (deprecated) or a from plugin config (recommended).
 *
 * ```js
 * "plugins": {
 *    "screenshotOnFail": {
 *      "enabled": true
 *    }
 * }
 * ```
 *
 * Possible config options:
 *
 * * `uniqueScreenshotNames`: use unique names for screenshot. Default: false.
 * * `fullPageScreenshots`: make full page screenshots. Default: false.
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

  const options = Object.assign(defaultConfig, helper.options, config);


  if (options.disableScreenshots) {
    // old version of disabling screenshots
    return;
  }

  event.dispatcher.on(event.test.failed, (test, fail) => {
    recorder.add('screenshot of failed test', async () => {
      let fileName = clearString(test.title);
      if (test.ctx && test.ctx.test && test.ctx.test.type === 'hook') fileName = clearString(`${test.title}_${test.ctx.test.title}`);
      if (options.uniqueScreenshotNames) {
        const uuid = test.uuid || test.ctx.test.uuid || Math.floor(new Date().getTime() / 1000);
        fileName = `${fileName.substring(0, 10)}_${uuid}.failed.png`;
      } else {
        fileName += '.failed.png';
      }
      output.plugin('screenshotOnFail', 'Test failed, saving screenshot');

      try {
        await helper.saveScreenshot(fileName, options.fullPageScreenshots);
        const allureReporter = Container.plugins('allure');
        if (allureReporter) {
          allureReporter.addAttachment('Last Seen Screenshot', fs.readFileSync(path.join(global.output_dir, fileName)), 'image/png');
        }
      } catch (err) {
        if (err &&
            err.type &&
            err.type === 'RuntimeError' &&
            err.message &&
            (err.message.indexOf('was terminated due to') > -1 || err.message.indexOf('no such window: target window already closed') > -1)
        ) {
          helper.isRunning = false;
        }
      }
    }, true);
  });
};
