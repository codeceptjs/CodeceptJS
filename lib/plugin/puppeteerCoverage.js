const debug = require('debug')('codeceptjs:plugin:puppeteerCoverage');
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

const supportedHelpers = ['Puppeteer'];

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
 * Dumps puppeteers code coverage after every test.
 *
 * #### Configuration
 *
 * Configuration can either be taken from a corresponding helper (deprecated) or a from plugin config (recommended).
 *
 * ```js
 * plugins: {
 *    puppeteerCoverage: {
 *      enabled: true
 *    }
 * }
 * ```
 *
 * Possible config options:
 *
 * * `coverageDir`: directory to dump coverage files
 * * `uniqueFileName`: generate a unique filename by adding uuid
 *
 *  First of all, your mileage may vary!
 *
 *  To work, you need the client javascript code to be NOT uglified. They need to be built in "development" mode.
 *  And the end of your tests, you'll get a directory full of coverage per test run.  Now what?
 *  You'll need to convert the coverage code to something istanbul can read.  Good news is someone wrote the code
 *  for you (see puppeteer-to-istanbul link below).  Then using istanbul you need to combine the converted
 *  coverage and create a report.  Good luck!
 *
 *  Links:
 *  * https://github.com/GoogleChrome/puppeteer/blob/v1.12.2/docs/api.md#class-coverage
 *  * https://github.com/istanbuljs/puppeteer-to-istanbul
 *  * https://github.com/gotwarlost/istanbul
 */
module.exports = function (config) {
  const helpers = Container.helpers();
  let coverageRunning = false;
  let helper;

  for (const helperName of supportedHelpers) {
    if (Object.keys(helpers).indexOf(helperName) > -1) {
      helper = helpers[helperName];
    }
  }

  if (!helper) {
    console.error('Coverage is only supported in Puppeteer');
    return; // no helpers for screenshot
  }

  const options = Object.assign(defaultConfig, helper.options, config);

  event.dispatcher.on(event.all.before, async (suite) => {
    output.debug('*** Collecting coverage for tests ****');
  });

  //  Hack!  we're going to try to "start" coverage before each step because this is
  //  when the browser is already up and is ready to start coverage.
  event.dispatcher.on(event.step.before, async (step) => {
    recorder.add(
      'starting coverage',
      async () => {
        try {
          if (!coverageRunning) {
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

  // Save puppeteer coverage data after every test run
  event.dispatcher.on(event.test.after, async (test) => {
    recorder.add(
      'saving coverage',
      async () => {
        try {
          if (coverageRunning) {
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
