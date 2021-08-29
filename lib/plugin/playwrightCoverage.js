const coverage = require('../coverage');

/**
 * Dumps playwright code coverage after every test.
 *
 * #### Configuration
 *
 *
 * ```js
 * plugins: {
 *    playwrightCoverage: {
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
 *  To work, you need the client JavaScript code to be NOT uglified. It needs to be built in "development" mode.
 *  And the end of your tests, you'll get a directory with code coverage collected per test run. 
 *  You'll need to convert the coverage code to something istanbul can read.
 *
 *  You can use [v8-to-istanbul](https://github.com/istanbuljs/v8-to-istanbul) to convert the same
 *  You can find an example of the same, in [Playwright website](https://playwright.dev/docs/api/class-coverage#coverage-stop-js-coverage)
 *
 *  Links:
 *  * https://playwright.dev/docs/api/class-coverage#coverage-stop-js-coverage
 *  * https://github.com/istanbuljs/v8-to-istanbul
 */
module.exports = coverage;
