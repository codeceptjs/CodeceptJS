import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { mkdirp } from 'mkdirp'

import Container from '../container.js'
import recorder from '../recorder.js'
import event from '../event.js'
import output from '../output.js'
import store from '../store.js'

import { fileExists, deleteDir, template } from '../utils.js'
import Codeceptjs from '../index.js'
import { testToFileName } from '../mocha/test.js'
import {
  parsePluginArgs,
  resolveTrigger,
  matchStepFile,
  matchUrl,
  getBrowserHelper,
} from '../utils/pluginParser.js'

const defaultConfig = {
  on: 'fail',
  slides: false,
  uniqueScreenshotNames: false,
  disableScreenshots: false,
  fullPageScreenshots: false,
  animateSlides: true,
  deleteSuccessful: true,
  ignoreSteps: [],
}

/**
 * Saves screenshots from the browser at points triggered by `on=`.
 *
 * Replaces the legacy `screenshotOnFail` plugin. Default `on=fail` preserves the
 * old behavior (screenshot when a test fails). Pass `slides=true` (with `on=step`)
 * to generate a step-by-step slideshow report — replaces the legacy
 * `stepByStepReport` plugin.
 *
 * #### Configuration
 *
 * ```js
 * plugins: {
 *   screenshot: {
 *     enabled: true,
 *     on: 'fail',
 *   }
 * }
 * ```
 *
 * #### `on=` modes
 *
 * * **fail** — screenshot when a test fails (default)
 * * **test** — screenshot at the end of every test
 * * **step** — screenshot after every step
 * * **file** — screenshot for steps in `path=...[;line=...]`
 * * **url** — screenshot when the current browser URL matches `pattern=...`
 *
 * Other config options:
 *
 * * `uniqueScreenshotNames`: use unique names for screenshot. Default: false.
 * * `fullPageScreenshots`: make full page screenshots. Default: false.
 * * `disableScreenshots`: legacy switch to skip the plugin entirely.
 * * `slides`: generate a step-by-step slideshow report (requires `on=step`). Default: false.
 * * `deleteSuccessful`: when `slides=true`, drop slideshow directories of passing tests. Default: true.
 * * `animateSlides`: when `slides=true`, animate transitions between slides. Default: true.
 * * `ignoreSteps`: when `slides=true`, RegExps of step names to skip in the slideshow.
 *
 * CLI examples:
 *
 * ```
 * npx codeceptjs run -p screenshot
 * npx codeceptjs run -p screenshot:on=step
 * npx codeceptjs run -p screenshot:on=step;slides=true
 * npx codeceptjs run -p screenshot:on=file:path=tests/login_test.js
 * npx codeceptjs run -p screenshot:on=url:pattern=/users/*
 * ```
 */
export default function (config = {}) {
  const helper = getBrowserHelper()
  if (!helper) return

  const cliArgs = parsePluginArgs(config._args)
  const trigger = resolveTrigger(cliArgs, config, { on: defaultConfig.on }, { name: 'screenshot' })
  if (!trigger) return

  const options = Object.assign({}, defaultConfig, helper.options, config)
  options.slides = cliArgs.slides ?? config.slides ?? defaultConfig.slides

  if (Codeceptjs.container.mocha()) {
    options.reportDir = Codeceptjs.container.mocha()?.options?.reporterOptions
      && Codeceptjs.container.mocha()?.options?.reporterOptions?.reportDir
  }

  if (options.disableScreenshots) return

  if (options.slides) {
    return wireSlides(options, trigger)
  }

  switch (trigger.on) {
    case 'fail':
      return wireOnFail(options)
    case 'test':
      return wireOnTest(options)
    case 'step':
      return wireOnStep(options, () => true)
    case 'file':
      return wireOnStep(options, step => matchStepFile(step, trigger.path, trigger.line))
    case 'url':
      return wireOnUrl(options, trigger.pattern)
  }
}

function wireOnFail(options) {
  let currentTest = null
  event.dispatcher.on(event.test.before, test => {
    currentTest = test
  })
  event.dispatcher.on(event.test.failed, (test, _err, hookName) => {
    if (hookName === 'BeforeSuite' || hookName === 'AfterSuite') return
    const t = test || currentTest
    if (!t) return
    scheduleScreenshot(t, suffix(t, options, 'failed'), options)
  })
}

function wireOnTest(options) {
  event.dispatcher.on(event.test.after, test => {
    if (!test) return
    scheduleScreenshot(test, suffix(test, options, 'test'), options)
  })
}

function wireOnStep(options, filter) {
  let currentTest = null
  let stepCount = 0
  event.dispatcher.on(event.test.before, test => {
    currentTest = test
    stepCount = 0
  })
  event.dispatcher.on(event.step.after, step => {
    if (!currentTest) return
    if (!filter(step)) return
    stepCount++
    const name = `${testToFileName(currentTest, { suffix: '', unique: options.uniqueScreenshotNames })}.step_${stepCount}.png`
    scheduleScreenshot(currentTest, name, options)
  })
}

function wireOnUrl(options, pattern) {
  let currentTest = null
  let stepCount = 0
  event.dispatcher.on(event.test.before, test => {
    currentTest = test
    stepCount = 0
  })
  event.dispatcher.on(event.step.after, () => {
    if (!currentTest) return
    const helper = getBrowserHelper()
    if (!helper) return
    recorder.add('screenshot:url check', async () => {
      try {
        const url = await helper.grabCurrentUrl()
        if (!matchUrl(url, pattern)) return
        stepCount++
        const name = `${testToFileName(currentTest, { suffix: '', unique: options.uniqueScreenshotNames })}.url_${stepCount}.png`
        await takeScreenshot(currentTest, name, options)
      } catch (err) {
        // page may not be ready
      }
    })
  })
}

function suffix(test, options, kind) {
  const base = testToFileName(test, { suffix: '', unique: options.uniqueScreenshotNames })
  return `${base}.${kind}.png`
}

function scheduleScreenshot(test, fileName, options) {
  recorder.add(
    'screenshot capture',
    async () => takeScreenshot(test, fileName, options),
    true,
  )
}

async function takeScreenshot(test, fileName, options) {
  const quietMode = !store.outputDir
  if (!quietMode) {
    output.plugin('screenshot', `Saving screenshot ${fileName}`)
  }

  const helper = getBrowserHelper()
  if (!helper || typeof helper.saveScreenshot !== 'function') return

  try {
    if (options.reportDir) {
      fileName = path.join(options.reportDir, fileName)
      const mochaReportDir = path.resolve(process.cwd(), options.reportDir)
      if (!fileExists(mochaReportDir)) fs.mkdirSync(mochaReportDir)
    }

    if (helper.page && helper.page.isClosed && helper.page.isClosed()) {
      throw new Error('Browser page has been closed')
    }
    if (helper.browser && helper.browser.isConnected && !helper.browser.isConnected()) {
      throw new Error('Browser has been disconnected')
    }

    const screenshotPromise = helper.saveScreenshot(fileName, options.fullPageScreenshots)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Screenshot timeout after 5 seconds')), 5000)
    })

    await Promise.race([screenshotPromise, timeoutPromise])

    if (!test.artifacts) test.artifacts = {}
    const baseOutputDir = store.outputDir || null
    if (baseOutputDir) {
      test.artifacts.screenshot = path.join(baseOutputDir, fileName)
      const mocha = Container.mocha()
      const junit = mocha?.options?.reporterOptions?.['mocha-junit-reporter']
      if (junit?.options?.attachments) {
        test.attachments = [path.join(baseOutputDir, fileName)]
      }
    } else {
      test.artifacts.screenshot = fileName
    }
  } catch (err) {
    if (!quietMode) {
      output.plugin('screenshot', `Failed to save screenshot: ${err.message}`)
    }
    if (
      err
      && ((err.message
        && (err.message.includes('Target page, context or browser has been closed')
          || err.message.includes('Browser page has been closed')
          || err.message.includes('Browser has been disconnected')
          || err.message.includes('was terminated due to')
          || err.message.includes('no such window: target window already closed')
          || err.message.includes('Screenshot timeout after')))
        || (err.type && err.type === 'RuntimeError'))
    ) {
      output.log(`Can't make screenshot, ${err.message}`)
      helper.isRunning = false
    }
  }
}

function wireSlides(options, trigger) {
  const reportDir = options.output
    ? path.resolve(store.codeceptDir, options.output)
    : (store.outputDir || './_output')

  const stepFilter = makeStepFilter(trigger, options)
  const recordedTests = {}

  let dir
  let stepNum
  let slides = {}
  let savedStep = null
  let currentTest = null
  let scenarioFailed = false

  event.dispatcher.on(event.suite.before, () => {
    stepNum = -1
  })

  event.dispatcher.on(event.test.before, test => {
    const hash = crypto.createHash('sha256').update(test.file + test.title).digest('hex')
    dir = path.join(reportDir, `record_${hash}`)
    mkdirp.sync(dir)
    stepNum = 0
    slides = {}
    savedStep = null
    currentTest = test
    scenarioFailed = false
  })

  event.dispatcher.on(event.step.failed, step => {
    recorder.add('slides: failed step', async () => persistStep(step), true)
  })

  event.dispatcher.on(event.step.after, step => {
    recorder.add('slides: step', async () => persistStep(step), true)
  })

  event.dispatcher.on(event.test.passed, test => {
    if (options.deleteSuccessful) {
      deleteDir(dir)
      return
    }
    persist(test)
  })

  event.dispatcher.on(event.test.failed, (test, _err, hookName) => {
    if (hookName === 'BeforeSuite' || hookName === 'AfterSuite') return
    persist(test)
  })

  event.dispatcher.on(event.all.result, () => {
    if (Object.keys(recordedTests).length === 0) return
    writeIndex(reportDir, recordedTests)
  })

  if (event.workers && event.workers.result) {
    event.dispatcher.on(event.workers.result, async () => {
      await recorder.add(() => {
        const tests = scanRecordDirs(reportDir)
        if (Object.keys(tests).length) writeIndex(reportDir, tests)
      })
    })
  }

  async function persistStep(step) {
    if (stepNum === -1) return
    if (savedStep === step) return
    if (scenarioFailed) return
    if (step.metaStep && step.metaStep.title === 'BeforeSuite') return
    if (!currentTest) return
    if (!stepFilter(step)) return
    if (isStepIgnored(step, options.ignoreSteps)) return

    const fileName = `${String(stepNum).padStart(4, '0')}.png`
    if (step.status === 'failed') scenarioFailed = true
    stepNum++
    slides[fileName] = step

    const helper = getBrowserHelper()
    if (!helper || typeof helper.saveScreenshot !== 'function') return

    try {
      const screenshotPath = path.join(dir, fileName)
      await helper.saveScreenshot(screenshotPath, options.fullPageScreenshots)
      step.artifacts = step.artifacts || {}
      step.artifacts.screenshot = screenshotPath

      currentTest.artifacts = currentTest.artifacts || {}
      currentTest.artifacts.screenshots = currentTest.artifacts.screenshots || []
      currentTest.artifacts.screenshots.push(screenshotPath)
    } catch (err) {
      output.plugin('screenshot', `Can't save step screenshot: ${err.message}`)
    } finally {
      savedStep = step
    }
  }

  function persist(test) {
    if (!Object.keys(slides).length) return

    const slideHtml = Object.keys(slides)
      .sort()
      .map((fileName, idx) => {
        const step = slides[fileName]
        const caption = step.toString().replace(/\[\d{2}m/g, '')
        const failed = step.status === 'failed' ? ' is-failed' : ''
        return template(SLIDE_TEMPLATE, {
          image: fileName,
          caption,
          index: idx + 1,
          activeClass: idx === 0 ? ' is-active' : '',
          failed,
        })
      })
      .join('')

    const dotHtml = Object.keys(slides)
      .map((_, idx) => `<button type="button" class="slides__dot${idx === 0 ? ' is-active' : ''}" data-slide="${idx}" aria-label="Step ${idx + 1}"></button>`)
      .join('')

    const html = template(SLIDESHOW_TEMPLATE, {
      title: test.title,
      feature: (test.parent && test.parent.title) || '',
      slides: slideHtml,
      dots: dotHtml,
      animate: options.animateSlides ? 'true' : 'false',
    })

    const indexFile = path.join(dir, 'index.html')
    fs.writeFileSync(indexFile, html)
    recordedTests[`${(test.parent && test.parent.title) || ''}: ${test.title}`] = path.relative(reportDir, indexFile)
  }
}

function makeStepFilter(trigger, options) {
  if (trigger.on === 'file' && trigger.path) {
    return step => matchStepFile(step, trigger.path, trigger.line)
  }
  if (trigger.on === 'fail') {
    return step => step.status === 'failed'
  }
  return () => true
}

function isStepIgnored(step, patterns) {
  if (!patterns || !patterns.length) return false
  for (const pattern of patterns) {
    if (step.title && step.title.match(pattern)) return true
  }
  return false
}

function scanRecordDirs(reportDir) {
  const out = {}
  try {
    for (const item of fs.readdirSync(reportDir, { withFileTypes: true })) {
      if (!item.isDirectory() || !item.name.startsWith('record_')) continue
      const indexFile = path.join(reportDir, item.name, 'index.html')
      if (!fs.existsSync(indexFile)) continue
      const html = fs.readFileSync(indexFile, 'utf-8')
      const titleMatch = html.match(/<title>([^<]*)<\/title>/)
      const label = titleMatch ? titleMatch[1].replace(/^Slides — /, '') : item.name
      out[label] = `${item.name}/index.html`
    }
  } catch (err) {
    // ignore
  }
  return out
}

function writeIndex(reportDir, recordedTests) {
  const items = Object.entries(recordedTests)
    .map(([name, href]) => `<li><a href="${href}">${escapeHtml(name)}</a></li>`)
    .join('\n')

  const html = template(INDEX_TEMPLATE, {
    time: new Date().toString(),
    records: items,
  })

  const indexPath = path.join(reportDir, 'records.html')
  fs.writeFileSync(indexPath, html)
  output.print(`Step-by-step preview: file://${indexPath}`)
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

const SLIDE_TEMPLATE = `
<figure class="slides__slide{{activeClass}}{{failed}}" data-index="{{index}}">
  <img class="slides__image" src="{{image}}" alt="">
  <figcaption class="slides__caption">
    <span class="slides__step">{{index}}</span>
    <span class="slides__text">{{caption}}</span>
  </figcaption>
</figure>
`

const SLIDESHOW_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Slides — {{feature}}: {{title}}</title>
<style>
  :root { color-scheme: dark; --bg: #0b0d10; --panel: #14181d; --fg: #e7ecef; --muted: #8a96a0; --accent: #ff5b00; --error: #c0392b; }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body { background: var(--bg); color: var(--fg); font: 14px/1.4 system-ui, -apple-system, "Segoe UI", Inter, sans-serif; display: flex; flex-direction: column; }
  header { padding: 14px 20px; background: var(--panel); border-bottom: 1px solid #1f262d; display: flex; align-items: baseline; gap: 16px; }
  header a { color: var(--muted); text-decoration: none; font-weight: 500; }
  header a:hover { color: var(--fg); }
  header .feature { color: var(--muted); }
  header .test { font-weight: 600; }
  .slides { flex: 1; position: relative; overflow: hidden; }
  .slides__slide { position: absolute; inset: 0; margin: 0; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .25s ease; }
  .slides[data-animate="false"] .slides__slide { transition: none; }
  .slides__slide.is-active { opacity: 1; pointer-events: auto; }
  .slides__image { max-width: 100%; max-height: 100%; object-fit: contain; box-shadow: 0 10px 40px rgba(0,0,0,.4); }
  .slides__caption { position: absolute; left: 20px; right: 20px; bottom: 24px; padding: 12px 16px; background: rgba(20,24,29,.92); border: 1px solid #1f262d; border-radius: 6px; display: flex; gap: 12px; align-items: baseline; }
  .slides__slide.is-failed .slides__caption { background: var(--error); border-color: var(--error); }
  .slides__step { font-variant-numeric: tabular-nums; color: var(--muted); font-weight: 600; min-width: 2ch; }
  .slides__slide.is-failed .slides__step { color: #ffd9d4; }
  .slides__text { word-break: break-word; }
  .nav { position: absolute; top: 0; bottom: 0; width: 25%; background: transparent; border: 0; cursor: pointer; color: transparent; }
  .nav--prev { left: 0; }
  .nav--next { right: 0; }
  .dots { display: flex; gap: 6px; justify-content: center; padding: 12px; background: var(--panel); border-top: 1px solid #1f262d; flex-wrap: wrap; }
  .slides__dot { width: 10px; height: 10px; border-radius: 50%; border: 0; background: #2a323a; cursor: pointer; padding: 0; }
  .slides__dot.is-active { background: var(--accent); }
  .slides__dot:hover { background: #3d4751; }
  .slides__dot.is-active:hover { background: var(--accent); }
  .hint { color: var(--muted); font-size: 12px; padding: 8px 20px; text-align: center; background: var(--panel); border-top: 1px solid #1f262d; }
</style>
</head>
<body>
<header>
  <a href="../records.html">&laquo; back</a>
  <span class="feature">{{feature}}</span>
  <span class="test">{{title}}</span>
</header>
<div class="slides" data-animate="{{animate}}">
  {{slides}}
  <button class="nav nav--prev" type="button" aria-label="Previous">&larr;</button>
  <button class="nav nav--next" type="button" aria-label="Next">&rarr;</button>
</div>
<nav class="dots">{{dots}}</nav>
<p class="hint">Use &larr; / &rarr; to navigate, click sides of image, or use the dots below.</p>
<script>
(function () {
  var slidesEl = document.querySelector('.slides');
  var slides = Array.prototype.slice.call(slidesEl.querySelectorAll('.slides__slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.slides__dot'));
  var idx = 0;
  function show(i) {
    if (i < 0) i = slides.length - 1;
    if (i >= slides.length) i = 0;
    slides[idx].classList.remove('is-active');
    dots[idx] && dots[idx].classList.remove('is-active');
    idx = i;
    slides[idx].classList.add('is-active');
    dots[idx] && dots[idx].classList.add('is-active');
  }
  document.querySelector('.nav--prev').addEventListener('click', function () { show(idx - 1); });
  document.querySelector('.nav--next').addEventListener('click', function () { show(idx + 1); });
  dots.forEach(function (d, i) { d.addEventListener('click', function () { show(i); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
})();
</script>
</body>
</html>
`

const INDEX_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Step-by-step Reports</title>
<style>
  :root { color-scheme: dark; --bg: #0b0d10; --panel: #14181d; --fg: #e7ecef; --muted: #8a96a0; --accent: #ff5b00; }
  * { box-sizing: border-box; }
  body { background: var(--bg); color: var(--fg); font: 14px/1.5 system-ui, -apple-system, "Segoe UI", Inter, sans-serif; max-width: 880px; margin: 0 auto; padding: 32px 24px; }
  h1 { margin: 0 0 4px; font-size: 22px; font-weight: 600; }
  .meta { color: var(--muted); margin-bottom: 24px; font-size: 13px; }
  ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 4px; }
  li { background: var(--panel); border: 1px solid #1f262d; border-radius: 6px; }
  li a { display: block; padding: 12px 16px; color: var(--fg); text-decoration: none; }
  li a:hover { background: #1c2229; border-color: var(--accent); }
</style>
</head>
<body>
<h1>Step-by-step Reports</h1>
<div class="meta">{{time}}</div>
<ul>
  {{records}}
</ul>
</body>
</html>
`
