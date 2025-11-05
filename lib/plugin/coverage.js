import debugModule from 'debug'
import { CoverageReport } from 'monocart-coverage-reports'
import Container from '../container.js'

import recorder from '../recorder.js'

import event from '../event.js'

import output from '../output.js'

import { deepMerge } from '../utils.js'

const defaultConfig = {
  name: 'CodeceptJS Coverage Report',
  outputDir: 'output/coverage',
}

const supportedHelpers = ['Puppeteer', 'Playwright', 'WebDriver']

const v8CoverageHelpers = {
  Playwright: {
    startCoverage: async page => {
      await Promise.all([
        page.coverage.startJSCoverage({
          resetOnNavigation: false,
        }),
        page.coverage.startCSSCoverage({
          resetOnNavigation: false,
        }),
      ])
    },
    takeCoverage: async (page, coverageReport) => {
      const [jsCoverage, cssCoverage] = await Promise.all([page.coverage.stopJSCoverage(), page.coverage.stopCSSCoverage()])
      const coverageList = [...jsCoverage, ...cssCoverage]
      await coverageReport.add(coverageList)
    },
  },
  Puppeteer: {
    startCoverage: async page => {
      await Promise.all([
        page.coverage.startJSCoverage({
          resetOnNavigation: false,
          includeRawScriptCoverage: true,
        }),
        page.coverage.startCSSCoverage({
          resetOnNavigation: false,
        }),
      ])
    },
    takeCoverage: async (page, coverageReport) => {
      const [jsCoverage, cssCoverage] = await Promise.all([page.coverage.stopJSCoverage(), page.coverage.stopCSSCoverage()])
      // to raw V8 script coverage
      const coverageList = [
        ...jsCoverage.map(it => {
          return {
            source: it.text,
            ...it.rawScriptCoverage,
          }
        }),
        ...cssCoverage,
      ]
      await coverageReport.add(coverageList)
    },
  },
  WebDriver: {
    startCoverage: async page => {
      await Promise.all([
        page.coverage.startJSCoverage({
          resetOnNavigation: false,
          includeRawScriptCoverage: true,
        }),
        page.coverage.startCSSCoverage({
          resetOnNavigation: false,
        }),
      ])
    },
    takeCoverage: async (page, coverageReport) => {
      const [jsCoverage, cssCoverage] = await Promise.all([page.coverage.stopJSCoverage(), page.coverage.stopCSSCoverage()])
      // to raw V8 script coverage
      const coverageList = [
        ...jsCoverage.map(it => {
          return {
            source: it.text,
            ...it.rawScriptCoverage,
          }
        }),
        ...cssCoverage,
      ]
      await coverageReport.add(coverageList)
    },
  },
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
 *      enabled: true,
 *      debug: true,
 *      name: 'CodeceptJS Coverage Report',
 *      outputDir: 'output/coverage'
 *    }
 * }
 * ```
 *
 * Possible config options, More could be found at [monocart-coverage-reports](https://github.com/cenfun/monocart-coverage-reports?tab=readme-ov-file#default-options)
 *
 * * `debug`: debug info. By default, false.
 * * `name`: coverage report name.
 * * `outputDir`: path to coverage report.
 * * `sourceFilter`: filter the source files.
 * * `sourcePath`: option to resolve a custom path.
 *
 */
export default function (config) {
  config = deepMerge(defaultConfig, config)

  if (config.debug) config.logging = 'debug'

  const helpers = Container.helpers()
  let coverageRunning = false

  const v8Names = Object.keys(v8CoverageHelpers)
  const helperName = Object.keys(helpers).find(it => v8Names.includes(it))
  if (!helperName) {
    console.error(`Coverage is only supported in ${supportedHelpers.join(' or ')}`)
    // no helpers for screenshot
    return
  }

  config.name = `${config.name} - in ${helperName}`
  const debug = debugModule(`codeceptjs:plugin:${helperName.toLowerCase()}Coverage`)

  const helper = helpers[helperName]

  const v8Helper = v8CoverageHelpers[helperName]

  const coverageOptions = {
    ...config,
  }

  if (helperName === 'WebDriver') coverageOptions.coverageProvider = 'v8'

  const coverageReport = new CoverageReport(coverageOptions)
  coverageReport.cleanCache()

  event.dispatcher.on(event.all.after, () => {
    // Add coverage generation to recorder to ensure it completes before process exit
    recorder.add(
      'generate coverage report',
      async () => {
        try {
          output.print(`writing ${coverageOptions.outputDir}`)
          await coverageReport.generate()
        } catch (error) {
          output.print(`Failed to generate coverage report: ${error.message}`)
          // Don't throw - coverage failure shouldn't fail tests
        }
      },
      true,
      false,
    )
  })

  //  we're going to try to "start" coverage before each step because this is
  //  when the browser is already up and is ready to start coverage.
  event.dispatcher.on(event.step.before, () => {
    recorder.add(
      'start coverage',
      async () => {
        if (coverageRunning) {
          return
        }
        if (!helper.page || !helper.page.coverage) {
          return
        }
        coverageRunning = true
        debug('--> starting coverage <--')
        await v8Helper.startCoverage(helper.page)
      },
      true,
    )
  })

  // Save coverage data after every test run
  event.dispatcher.on(event.test.after, test => {
    recorder.add(
      'take coverage',
      async () => {
        if (!coverageRunning) {
          return
        }
        if (!helper.page || !helper.page.coverage) {
          return
        }
        coverageRunning = false
        debug('--> stopping coverage <--')
        await v8Helper.takeCoverage(helper.page, coverageReport)
      },
      true,
    )
  })
}
