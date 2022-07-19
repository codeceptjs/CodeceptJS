const debugModule = require('debug');
const fs = require('fs');
const path = require('path');

const Container = require('../container');
const recorder = require('../recorder');
const event = require('../event');
const output = require('../output');
const { clearString } = require('../utils');

const defaultConfig = {
  coverageDir: 'output/coverage',
  uniqueFileName: true,
};

const supportedHelpers = ['Puppeteer', 'Playwright'];

function buildFileName(test, uniqueFileName) {
  let fileName = clearString(test.title);

  // This prevent data driven to be included in the failed screenshot file name
  if (fileName.indexOf('{') !== -1) {
    fileName = fileName.substr(0, fileName.indexOf('{') - 3).trim();
  }

  if (test.ctx && test.ctx.test && test.ctx.test.type === 'hook') {
    fileName = clearString(`${test.title}_${test.ctx.test.title}`);
  }

  if (uniqueFileName) {
    const uuid = test.uuid
      || test.ctx.test.uuid
      || Math.floor(new Date().getTime() / 1000);

    fileName = `${fileName.substring(0, 10)}_${uuid}.coverage.json`;
  } else {
    fileName = `${fileName}.coverage.json`;
  }

  return fileName;
}

/**
 * Dumps code coverage from Playwright/Puppeteer after every test.
 *
 * #### Configuration
 *
 *
 * ```js
 * plugins: {
 *    coverage: {
 *      enabled: true
 *    }
 * }
 * ```
 *
 * Possible config options:
 *
 * * `coverageDir`: directory to dump coverage files
 * * `uniqueFileName`: generate a unique filename by adding uuid
 */
module.exports = function (config) {
  const helpers = Container.helpers();
  let coverageRunning = false;
  let helper;

  let debug;
  for (const helperName of supportedHelpers) {
    if (Object.keys(helpers).indexOf(helperName) > -1) {
      helper = helpers[helperName];
      debug = debugModule(`codeceptjs:plugin:${helperName.toLowerCase()}Coverage`);
    }
  }

  if (!helper) {
    console.error('Coverage is only supported in Puppeteer, Playwright');
    return; // no helpers for screenshot
  }

  const options = Object.assign(defaultConfig, helper.options, config);

  event.dispatcher.on(event.all.before, async () => {
    output.debug('*** Collecting coverage for tests ****');
  });

  //  Hack!  we're going to try to "start" coverage before each step because this is
  //  when the browser is already up and is ready to start coverage.
  event.dispatcher.on(event.step.before, async () => {
    recorder.add(
      'starting coverage',
      async () => {
        try {
          if (!coverageRunning && helper.page && helper.page.coverage) {
            debug('--> starting coverage <--');
            coverageRunning = true;
            await helper.page.coverage.startJSCoverage();
          }
        } catch (err) {
          console.error(err);
        }
      },
      true,
    );
  });

  // Save coverage data after every test run
  event.dispatcher.on(event.test.after, async (test) => {
    recorder.add(
      'saving coverage',
      async () => {
        try {
          if (coverageRunning && helper.page && helper.page.coverage) {
            debug('--> stopping coverage <--');
            coverageRunning = false;
            const coverage = await helper.page.coverage.stopJSCoverage();

            const coverageDir = path.resolve(
              process.cwd(),
              options.coverageDir,
            );

            // Checking if coverageDir already exists, if not, create new one

            if (!fs.existsSync(coverageDir)) {
              fs.mkdirSync(coverageDir, { recursive: true });
            }

            const coveragePath = path.resolve(
              coverageDir,
              buildFileName(test, options.uniqueFileName),
            );
            output.print(`writing ${coveragePath}`);
            fs.writeFileSync(coveragePath, JSON.stringify(coverage));
          }
        } catch (err) {
          console.error(err);
        }
      },
      true,
    );
  });
};
