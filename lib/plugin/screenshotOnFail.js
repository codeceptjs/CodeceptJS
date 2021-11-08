const fs = require('fs');
const path = require('path');

const Container = require('../container');
const recorder = require('../recorder');
const event = require('../event');
const output = require('../output');
const { fileExists, clearString } = require('../utils');
const Codeceptjs = require('../index');

const defaultConfig = {
  uniqueScreenshotNames: false,
  disableScreenshots: false,
  fullPageScreenshots: false,
};

const supportedHelpers = require('./standardActingHelpers');

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
 * plugins: {
 *    screenshotOnFail: {
 *      enabled: true
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

  if (helpers.Mochawesome) {
    if (helpers.Mochawesome.config) {
      options.uniqueScreenshotNames = helpers.Mochawesome.config.uniqueScreenshotNames;
    }
  }
  options.reportDir = false;
  if (
    Codeceptjs.container.mocha()
    && typeof Codeceptjs.container.mocha().options.reporterOptions !== 'undefined'
    && typeof Codeceptjs.container.mocha().options.reporterOptions.reportDir !== 'undefined'
  ) {
    options.reportDir = Codeceptjs.container.mocha().options.reporterOptions.reportDir;
  }
  // support mocha-multi-reporters
  if (
    Codeceptjs.container.mocha()
    && typeof Codeceptjs.container.mocha().options.reporterOptions.mochawesomeReporterOptions !== 'undefined'
    && typeof Codeceptjs.container.mocha().options.reporterOptions.mochawesomeReporterOptions.reportDir !== 'undefined'
  ) {
    options.reportDir =  Container.mocha().options.reporterOptions.mochawesomeReporterOptions.reportDir;
  }

  let outputFolder = options.reportDir;
  if (options.screenshotFolder) {
    outputFolder = options.screenshotFolder;
  }

  event.dispatcher.on(event.test.failed, (test) => {
    recorder.add('screenshot of failed test', async () => {
      let fileName = clearString(test.title);
      // This prevent data driven to be included in the failed screenshot file name
      if (fileName.indexOf('{') !== -1) {
        fileName = fileName.substr(0, (fileName.indexOf('{') - 3)).trim();
      }
      if (test.ctx && test.ctx.test && test.ctx.test.type === 'hook') fileName = clearString(`${test.title}_${test.ctx.test.title}`);
      if (options.uniqueScreenshotNames && test) {
        const uuid = _getUUID(test);
        fileName = `${fileName.substring(0, 10)}_${uuid}.failed.png`;
      } else {
        fileName += '.failed.png';
      }
      output.plugin('screenshotOnFail', 'Test failed, try to save a screenshot');

      try {
        if (outputFolder) {
          fileName = path.join(outputFolder, fileName);
          const mochaReportDir = path.resolve(process.cwd(), outputFolder);
          if (!fileExists(mochaReportDir)) {
            fs.mkdirSync(mochaReportDir);
          }
        }
        await helper.saveScreenshot(fileName, options.fullPageScreenshots);

        let relativeFileName = path.relative(options.reportDir,fileName);

        if (!test.artifacts) test.artifacts = {};
        test.artifacts.screenshot = relativeFileName;
        if (
          // support mocha
          (Container.mocha().options.reporterOptions['mocha-junit-reporter'] && Container.mocha().options.reporterOptions['mocha-junit-reporter'].options.attachments)
          // support mocha-multi-reporters
          || (Container.mocha().options.reporterOptions['mochaJunitReporterReporterOptions'] && Container.mocha().options.reporterOptions['mochaJunitReporterReporterOptions'].attachments)
        ){
          test.attachments = [relativeFileName];
        }

        const allureReporter = Container.plugins('allure');
        if (allureReporter) {
          allureReporter.addAttachment('Last Seen Screenshot', fs.readFileSync(path.join(global.output_dir, fileName)), 'image/png');
        }

        const cucumberReporter = Container.plugins('cucumberJsonReporter');
        if (cucumberReporter) {
          cucumberReporter.addScreenshot(test.artifacts.screenshot);
        }
      } catch (err) {
        output.plugin(err);
        if (
          err
          && err.type
          && err.type === 'RuntimeError'
          && err.message
          && (
            err.message.indexOf('was terminated due to') > -1
            || err.message.indexOf('no such window: target window already closed') > -1
          )
        ) {
          output.log(`Can't make screenshot, ${err}`);
          helper.isRunning = false;
        }
      }
    }, true);
  });

  function _getUUID(test) {
    if (test.uuid) {
      return test.uuid;
    }

    if (test.ctx && test.ctx.test.uuid) {
      return test.ctx.test.uuid;
    }

    return Math.floor(new Date().getTime() / 1000);
  }
};
