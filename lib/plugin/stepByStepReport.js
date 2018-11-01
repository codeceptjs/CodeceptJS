const Container = require('../container');
const recorder = require('../recorder');
const event = require('../event');
const output = require('../output');
const mkdirp = require('mkdirp');
const fs = require('fs');
const path = require('path');
const figures = require('figures');
const colors = require('chalk');
const { template, clearString, deleteDir } = require('../utils');

const supportedHelpers = [
  'WebDriverIO',
  'Protractor',
  'Appium',
  'Nightmare',
  'Puppeteer',
];

const defaultConfig = {
  deleteSuccessful: true,
  animateSlides: true,
  ignoreSteps: [],
  fullPageScreenshots: false,
};

const templates = {};

/**
 * ![](https://codecept.io/images/codeceptjs-slideshow.gif)
 *
 * Generates step by step report for a test.
 * After each step in a test a screenshot is created. After test executed screenshots are combined into slideshow.
 * By default, reports are generated only for failed tests.
 *
 *
 * Run tests with plugin enabled:
 *
 * ```
 * codeceptjs run --plugins stepByStepReport
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
 *
 * #### Allure Reports
 *
 * If Allure plugin is enabled this plugin attaches each saved screenshot to allure report.
 *
 *
 * @param {*} config
 */
module.exports = function (config) {
  const helpers = Container.helpers();
  let helper;

  config = Object.assign(defaultConfig, config);

  for (const helperName of supportedHelpers) {
    if (Object.keys(helpers).indexOf(helperName) > -1) {
      helper = helpers[helperName];
    }
  }

  if (!helper) return; // no helpers for screenshot

  let dir;
  let stepNum;
  let slides = {};
  let error;
  let savedStep = null;
  const uuid = Math.floor(new Date().getTime() / 1000);
  const recordedTests = {};
  const pad = '0000';

  event.dispatcher.on(event.test.before, (test) => {
    dir = path.join(global.output_dir, `record_${clearString(test.title).substring(0, 20)}_${uuid}`);
    mkdirp.sync(dir);
    stepNum = 0;
    error = null;
    slides = {};
    savedStep = null;
  });

  event.dispatcher.on(event.step.after, (step) => {
    recorder.add('screenshot of failed test', async () => persistStep(step), true);
  });

  event.dispatcher.on(event.step.failed, persistStep);


  event.dispatcher.on(event.test.passed, (test) => {
    if (!config.deleteSuccessful) return persist(test);
    // cleanup
    deleteDir(dir);
  });

  event.dispatcher.on(event.test.failed, (test, err) => {
    persist(test, err);
  });

  event.dispatcher.on(event.all.result, () => {
    if (!Object.keys(slides).length) return;

    let links = '';

    for (const link in recordedTests) {
      links += `<li><a href="${recordedTests[link]}">${link}</a></li>\n`;
    }

    const indexHTML = template(templates.index, {
      time: Date().toString(),
      records: links,
    });

    fs.writeFileSync(path.join(global.output_dir, 'records.html'), indexHTML);

    output.print(`${figures.circleFilled} Step-by-step preview: ${colors.white.bold(`file://${global.output_dir}/records.html`)}`);
  });

  async function persistStep(step) {
    if (isStepIgnored(step)) return;
    if (savedStep === step) return; // already saved
    const fileName = `${pad.substring(0, pad.length - stepNum.toString().length) + stepNum.toString()}.png`;
    try {
      stepNum++;
      slides[fileName] = step;
      await helper.saveScreenshot(path.relative(global.output_dir, path.join(dir, fileName)), config.fullPageScreenshots);
    } catch (err) {
      output.plugin(`Can't save step screenshot: ${err}`);
      error = err;
    }
    savedStep = step;

    const allureReporter = Container.plugins('allure');
    if (allureReporter) {
      output.plugin('stepByStepReport', 'Adding screenshot to Allure');
      allureReporter.addAttachment('Screenshot', fs.readFileSync(path.join(dir, fileName)), 'image/png');
    }
  }

  function persist(test, err) {
    if (error) return;

    let indicatorHtml = '';
    let slideHtml = '';

    for (const i in slides) {
      const step = slides[i];
      const stepNum = parseInt(i, 10);
      indicatorHtml += template(templates.indicator, {
        step: stepNum,
        isActive: stepNum ? '' : 'class="active"',
      });

      slideHtml += template(templates.slides, {
        image: i,
        caption: step.toString(),
        isActive: stepNum ? '' : 'active',
        isError: step.status === 'failed' ? 'error' : '',
      });
    }

    const html = template(templates.global, {
      indicators: indicatorHtml,
      slides: slideHtml,
      feature: test.parent && test.parent.title,
      test: test.title,
      carousel_class: config.animateSlides ? ' slide' : '',
    });

    const index = path.join(dir, 'index.html');
    fs.writeFileSync(index, html);
    recordedTests[`${test.parent.title}: ${test.title}`] = path.relative(global.output_dir, index);
  }

  function isStepIgnored(step) {
    if (!config.ignoreSteps) return;
    for (const pattern of config.ignoreSteps || []) {
      if (step.name.match(pattern)) return true;
    }
    return false;
  }
};

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
`;

templates.indicator = `
<li data-target="#steps" data-slide-to="{{step}}" {{isActive}}></li>
`;

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
`;

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
`;
