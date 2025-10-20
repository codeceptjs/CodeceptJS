const colors = require('chalk')
const crypto = require('crypto')
const figures = require('figures')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const cheerio = require('cheerio')

const Container = require('../container')
const recorder = require('../recorder')
const event = require('../event')
const output = require('../output')
const { template, deleteDir } = require('../utils')

const supportedHelpers = Container.STANDARD_ACTING_HELPERS

const defaultConfig = {
  deleteSuccessful: true,
  animateSlides: true,
  ignoreSteps: [],
  fullPageScreenshots: false,
  output: global.output_dir,
  screenshotsForAllureReport: false,
  disableScreenshotOnFail: true,
}

const templates = {}

/**
 * ![step-by-step-report](https://codecept.io/img/codeceptjs-slideshow.gif)
 *
 * Generates step by step report for a test.
 * After each step in a test a screenshot is created. After test executed screenshots are combined into slideshow.
 * By default, reports are generated only for failed tests.
 *
 *
 * Run tests with plugin enabled:
 *
 * ```
 * npx codeceptjs run --plugins stepByStepReport
 * ```
 *
 * #### Configuration
 *
 * ```js
 * "plugins": {
 *    "stepByStepReport": {
 *      "enabled": true
 *    }
 * }
 * ```
 *
 * Possible config options:
 *
 * * `deleteSuccessful`: do not save screenshots for successfully executed tests. Default: true.
 * * `animateSlides`: should animation for slides to be used. Default: true.
 * * `ignoreSteps`: steps to ignore in report. Array of RegExps is expected. Recommended to skip `grab*` and `wait*` steps.
 * * `fullPageScreenshots`: should full page screenshots be used. Default: false.
 * * `output`: a directory where reports should be stored. Default: `output`.
 * * `screenshotsForAllureReport`: If Allure plugin is enabled this plugin attaches each saved screenshot to allure report. Default: false.
 * * `disableScreenshotOnFail : Disables the capturing of screeshots after the failed step. Default: true.
 *
 * @param {*} config
 */

module.exports = function (config) {
  const helpers = Container.helpers()
  let helper

  config = Object.assign(defaultConfig, config)

  for (const helperName of supportedHelpers) {
    if (Object.keys(helpers).indexOf(helperName) > -1) {
      helper = helpers[helperName]
    }
  }

  if (!helper) return // no helpers for screenshot

  let dir
  let stepNum
  let slides = {}
  let error
  let savedStep = null
  let currentTest = null
  let scenarioFailed = false

  const recordedTests = {}
  const pad = '0000'
  const reportDir = config.output ? path.resolve(global.codecept_dir, config.output) : defaultConfig.output

  event.dispatcher.on(event.suite.before, suite => {
    stepNum = -1
  })

  event.dispatcher.on(event.test.before, test => {
    const sha256hash = crypto
      .createHash('sha256')
      .update(test.file + test.title)
      .digest('hex')
    dir = path.join(reportDir, `record_${sha256hash}`)
    mkdirp.sync(dir)
    stepNum = 0
    error = null
    slides = {}
    savedStep = null
    currentTest = test
  })

  event.dispatcher.on(event.step.failed, step => {
    recorder.add('screenshot of failed test', async () => persistStep(step), true)
  })

  event.dispatcher.on(event.step.after, step => {
    recorder.add('screenshot of step of test', async () => persistStep(step), true)
  })

  event.dispatcher.on(event.test.passed, test => {
    if (!config.deleteSuccessful) return persist(test)
    // cleanup
    deleteDir(dir)
  })

  event.dispatcher.on(event.test.failed, (test, _err, hookName) => {
    if (hookName === 'BeforeSuite' || hookName === 'AfterSuite') {
      // no browser here
      return
    }

    persist(test)
  })

  event.dispatcher.on(event.all.result, () => {
    if (Object.keys(recordedTests).length === 0 || !Object.keys(slides).length) return
    generateRecordsHtml(recordedTests)
  })

  event.dispatcher.on(event.workers.result, async () => {
    await recorder.add(() => {
      const recordedTests = getRecordFoldersWithDetails(reportDir)
      generateRecordsHtml(recordedTests)
    })
  })

  function getRecordFoldersWithDetails(dirPath) {
    let results = {}

    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true })

      items.forEach(item => {
        if (item.isDirectory() && item.name.startsWith('record_')) {
          const recordFolderPath = path.join(dirPath, item.name)
          const indexPath = path.join(recordFolderPath, 'index.html')

          let name = ''
          if (fs.existsSync(indexPath)) {
            try {
              const htmlContent = fs.readFileSync(indexPath, 'utf-8')
              const $ = cheerio.load(htmlContent)
              name = $('.navbar-brand').text().trim()
            } catch (err) {
              console.error(`Error reading index.html in ${recordFolderPath}:`, err.message)
            }
          }

          results[name || 'Unkown'] = `${item.name}/index.html`
        }
      })
    } catch (err) {
      console.error(`Error reading directory ${dirPath}:`, err.message)
    }

    return results
  }

  function generateRecordsHtml(recordedTests) {
    let links = ''

    for (const link in recordedTests) {
      links += `<li><a href="${recordedTests[link]}">${link}</a></li>\n`
    }

    const indexHTML = template(templates.index, {
      time: Date().toString(),
      records: links,
    })

    fs.writeFileSync(path.join(reportDir, 'records.html'), indexHTML)

    output.print(`${figures.circleFilled} Step-by-step preview: ${colors.white.bold(`file://${reportDir}/records.html`)}`)
  }

  async function persistStep(step) {
    if (stepNum === -1) return // Ignore steps from BeforeSuite function
    if (isStepIgnored(step)) return
    if (savedStep === step) return // already saved
    // Ignore steps from BeforeSuite function
    if (scenarioFailed && config.disableScreenshotOnFail) return
    if (step.metaStep && step.metaStep.name === 'BeforeSuite') return
    if (!step.test) return // Ignore steps from AfterSuite

    const fileName = `${pad.substring(0, pad.length - stepNum.toString().length) + stepNum.toString()}.png`
    if (step.status === 'failed') {
      scenarioFailed = true
    }
    stepNum++
    slides[fileName] = step
    try {
      await helper.saveScreenshot(path.join(dir, fileName), config.fullPageScreenshots)
    } catch (err) {
      output.plugin(`Can't save step screenshot: ${err}`)
      error = err
      return
    } finally {
      savedStep = step
    }

    if (!currentTest.artifacts.screenshots) currentTest.artifacts.screenshots = []
    // added attachments to test
    currentTest.artifacts.screenshots.push(path.join(dir, fileName))

    const allureReporter = Container.plugins('allure')
    if (allureReporter && config.screenshotsForAllureReport) {
      output.plugin('stepByStepReport', 'Adding screenshot to Allure')
      allureReporter.addAttachment(`Screenshot of step ${step}`, fs.readFileSync(path.join(dir, fileName)), 'image/png')
    }
  }

  function persist(test) {
    if (error) return

    let indicatorHtml = ''
    let slideHtml = ''

    for (const i in slides) {
      const step = slides[i]
      const stepNum = parseInt(i, 10)
      indicatorHtml += template(templates.indicator, {
        step: stepNum,
        isActive: stepNum ? '' : 'class="active"',
      })

      slideHtml += template(templates.slides, {
        image: i,
        caption: step.toString().replace(/\[\d{2}m/g, ''), // remove ANSI escape sequence
        isActive: stepNum ? '' : 'active',
        isError: step.status === 'failed' ? 'error' : '',
      })
    }

    const html = template(templates.global, {
      indicators: indicatorHtml,
      slides: slideHtml,
      feature: test.parent && test.parent.title,
      test: test.title,
      carousel_class: config.animateSlides ? ' slide' : '',
    })

    const index = path.join(dir, 'index.html')
    fs.writeFileSync(index, html)
    recordedTests[`${test.parent.title}: ${test.title}`] = path.relative(reportDir, index)
  }

  function isStepIgnored(step) {
    if (!config.ignoreSteps) return
    for (const pattern of config.ignoreSteps || []) {
      if (step.name.match(pattern)) return true
    }
    return false
  }
}

templates.slides = `
<div class="item {{isActive}}">
    <div class="fill">
        <img src="{{image}}">
    </div>
    <div class="carousel-caption {{isError}}">
        <h2>{{caption}}</h2>
        <small>scroll up and down to see the full page</small>
    </div>
</div>
`

templates.indicator = `
<li data-target="#steps" data-slide-to="{{step}}" {{isActive}}></li>
`

templates.index = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Step by Steps Report</title>

    <link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-default" role="navigation">
        <div class="navbar-header">
            <a class="navbar-brand" href="#">Step by Step Report
            </a>
        </div>
    </nav>
    <div class="container">
        <h1>Recorded <small>@ {{time}}</small></h1>
        <ul>
            {{records}}
        </ul>
    </div>

</body>
</html>
`

templates.global = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Recorder Result</title>

    <!-- Bootstrap Core CSS -->
    <link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css" rel="stylesheet">

    <style>
        html,
        body {
            height: 100%;
        }
        .carousel,
        .item,
        .active {
            height: 100%;
        }
        .navbar {
            margin-bottom: 0px !important;
        }
        .carousel-caption {
            background: rgba(0,0,0,0.8);
            padding-bottom: 50px !important;
        }
        .carousel-caption.error {
            background: #c0392b !important;
        }

        .carousel-inner {
            height: 100%;
        }

        .fill {
            width: 100%;
            height: 100%;
            text-align: center;
            overflow-y: scroll;
            background-position: top;
            -webkit-background-size: cover;
            -moz-background-size: cover;
            background-size: cover;
            -o-background-size: cover;
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-default" role="navigation">
        <div class="navbar-header">
            <a class="navbar-brand" href="../records.html">
                &laquo;
                {{feature}}
                <small>{{test}}</small>
            </a>
        </div>
    </nav>
    <header id="steps" class="carousel{{carousel_class}}">
        <!-- Indicators -->
        <ol class="carousel-indicators">
            {{indicators}}
        </ol>

        <!-- Wrapper for Slides -->
        <div class="carousel-inner">
            {{slides}}
        </div>

        <!-- Controls -->
        <a class="left carousel-control" href="#steps" data-slide="prev">
            <span class="icon-prev"></span>
        </a>
        <a class="right carousel-control" href="#steps" data-slide="next">
            <span class="icon-next"></span>
        </a>

    </header>

    <!-- jQuery -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>

    <!-- Script to Activate the Carousel -->
    <script>
    $('.carousel').carousel({
        wrap: true,
        interval: false
    })

    $(document).bind('keyup', function(e) {
      if(e.keyCode==39){
      jQuery('a.carousel-control.right').trigger('click');
      }

      else if(e.keyCode==37){
      jQuery('a.carousel-control.left').trigger('click');
      }

    });

    </script>

</body>

</html>
`
