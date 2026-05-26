import fs from 'fs'
import path from 'path'
import { mkdirp } from 'mkdirp'
import { v4 as uuidv4 } from 'uuid'

import Container from '../container.js'
import recorder from '../recorder.js'
import event from '../event.js'
import output from '../output.js'
import store from '../store.js'

import { testToFileName } from '../mocha/test.js'
import { parsePluginArgs, resolveTrigger, getBrowserHelper } from '../utils/pluginParser.js'

const defaultConfig = {
  on: 'fail',
  captions: true,
  subtitles: false,
  video: true,
}

/**
 * Records WebM video of tests using Playwright's screencast API.
 *
 * When `captions` is enabled, action annotations are burned into the video;
 * when `subtitles` is enabled, a standalone `.srt` is also produced. Default
 * `on=fail` keeps videos for failed tests only; `on=test` keeps every test's
 * video.
 *
 * Note: enabling Playwright's helper-level `video: true` together with this
 * plugin produces two independent recordings (`output/videos/*.webm` from the
 * helper, `output/screencast/*.webm` from this plugin).
 *
 * #### Configuration
 *
 * ```js
 * plugins: {
 *   screencast: {
 *     enabled: true,
 *     on: 'fail',
 *   }
 * }
 * ```
 *
 * #### `on=` modes
 *
 * * **fail** — record while running; delete on pass, keep on fail (default)
 * * **test** — record and keep every test's video
 *
 * Other config options:
 *
 * * `captions`: burn-in action overlays via `page.screencast.showActions()`. Default: true.
 * * `subtitles`: also write a standalone `.srt` file alongside the video. Default: false.
 * * `video`: record a video. With `video=false, subtitles=true`, only the `.srt` is produced. Default: true.
 * * `size`: pass-through `{ width, height }` for `screencast.start`.
 * * `quality`: pass-through 0–100 for `screencast.start`.
 *
 * CLI examples:
 *
 * ```
 * npx codeceptjs run -p screencast
 * npx codeceptjs run -p screencast:on=test
 * npx codeceptjs run -p screencast:on=test;captions=false;subtitles=true
 * ```
 */
export default function (config = {}) {
  const helper = getBrowserHelper()
  if (!helper) return

  const cliArgs = parsePluginArgs(config._args)
  const trigger = resolveTrigger(cliArgs, config, { on: defaultConfig.on }, {
    name: 'screencast',
    validModes: ['fail', 'test'],
  })
  if (!trigger) return

  const options = Object.assign({}, defaultConfig, config)
  options.captions = cliArgs.captions ?? config.captions ?? defaultConfig.captions
  options.subtitles = cliArgs.subtitles ?? config.subtitles ?? defaultConfig.subtitles
  options.video = cliArgs.video ?? config.video ?? defaultConfig.video

  return wireScreencast(trigger.on, options)
}

function wireScreencast(mode, options) {
  const state = {
    test: null,
    webmPath: null,
    srtPath: null,
    steps: null,
    startedAt: null,
    failed: false,
    startQueued: false,
    started: false,
    warnedNoApi: false,
  }

  event.dispatcher.on(event.test.before, test => {
    state.test = test
    state.failed = false
    state.webmPath = null
    state.srtPath = null
    state.startQueued = false
    state.started = false
    state.steps = options.subtitles ? {} : null
    state.startedAt = options.subtitles ? Date.now() : null
  })

  event.dispatcher.on(event.test.started, test => {
    if (!options.video || state.startQueued) return
    state.startQueued = true
    recorder.add('screencast:start', async () => startScreencast(state.test, options, state), true)
  })

  event.dispatcher.on(event.step.started, step => {
    if (state.steps) {
      const at = Date.now()
      step.id = step.id || uuidv4()
      state.steps[step.id] = {
        start: formatTimestamp(at - state.startedAt),
        startedAt: at,
        title: stepTitle(step),
      }
    }
  })

  if (options.subtitles) {
    event.dispatcher.on(event.step.finished, step => {
      if (!state.steps || !step?.id || !state.steps[step.id]) return
      state.steps[step.id].end = formatTimestamp(Date.now() - state.startedAt)
    })
  }

  event.dispatcher.on(event.test.failed, (test, _err, hookName) => {
    if (hookName === 'BeforeSuite' || hookName === 'AfterSuite') return
    state.failed = true
  })

  event.dispatcher.on(event.test.after, () => {
    if (!state.test) return
    recorder.add('screencast:stop', async () => finalizeScreencast({
      test: state.test,
      webmPath: state.webmPath,
      srtPath: state.srtPath,
      steps: state.steps,
      failed: state.failed,
      started: state.started,
      options,
      mode,
    }), true)
  })
}

async function startScreencast(test, options, state) {
  const helper = getBrowserHelper()
  if (!helper?.page?.screencast) {
    if (!state.warnedNoApi) {
      output.plugin('screencast', 'page.screencast not available — requires Playwright >= 1.59. Skipping.')
      state.warnedNoApi = true
    }
    return
  }

  const baseDir = path.join(store.outputDir || '_output', 'screencast')
  mkdirp.sync(baseDir)
  const baseName = testToFileName(test, { suffix: '', unique: true })
  state.webmPath = path.join(baseDir, `${baseName}.webm`)
  state.srtPath = path.join(baseDir, `${baseName}.srt`)

  const startOpts = { path: state.webmPath }
  if (options.size) startOpts.size = options.size
  if (options.quality != null) startOpts.quality = options.quality

  try {
    await helper.page.screencast.start(startOpts)
    state.started = true
  } catch (err) {
    output.plugin('screencast', `Failed to start: ${err.message}`)
    state.webmPath = null
    state.srtPath = null
    state.started = false
    return
  }

  if (options.captions && typeof helper.page.screencast.showActions === 'function') {
    try { await helper.page.screencast.showActions() }
    catch (err) { output.plugin('screencast', `showActions failed: ${err.message}`) }
  }
  if (typeof helper.page.screencast.showChapter === 'function') {
    try { await helper.page.screencast.showChapter(String(test.title || '')) }
    catch (err) { output.plugin('screencast', `showChapter failed: ${err.message}`) }
  }
}

async function finalizeScreencast(snapshot) {
  const { test, options, mode, steps } = snapshot
  let { webmPath, srtPath } = snapshot

  const helper = getBrowserHelper()
  if (snapshot.started && helper?.page?.screencast) {
    try {
      await helper.page.screencast.stop()
    } catch (err) {
      output.plugin('screencast', `stop failed: ${err.message}`)
    }
  }

  const shouldKeep = mode === 'test' || (mode === 'fail' && snapshot.failed)

  if (options.video && webmPath) {
    if (!shouldKeep) {
      try { fs.unlinkSync(webmPath) } catch { /* file may not exist yet */ }
      webmPath = null
    } else {
      ensureArtifactsObject(test)
      test.artifacts.screencast = webmPath
      attachJUnitArtifact(test, webmPath)
    }
  }

  if (options.subtitles && steps) {
    if (options.video && !shouldKeep) {
      try { srtPath && fs.unlinkSync(srtPath) } catch { /* nothing to delete */ }
      return
    }

    let target = srtPath
    if (!options.video) {
      if (test.artifacts && test.artifacts.video) {
        const { dir, name } = path.parse(test.artifacts.video)
        target = path.join(dir, `${name}.srt`)
      } else {
        const baseDir = path.join(store.outputDir || '_output', 'screencast')
        mkdirp.sync(baseDir)
        const baseName = testToFileName(test, { suffix: '', unique: true })
        target = path.join(baseDir, `${baseName}.srt`)
      }
    }

    if (!target) return
    try {
      await fs.promises.writeFile(target, buildSrt(steps))
      ensureArtifactsObject(test)
      test.artifacts.subtitle = target
    } catch (err) {
      output.plugin('screencast', `failed to write SRT: ${err.message}`)
    }
  }
}

function formatTimestamp(timestampInMs) {
  const date = new Date(0, 0, 0, 0, 0, 0, timestampInMs)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  const ms = timestampInMs - (hours * 3600000 + minutes * 60000 + seconds * 1000)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
}

function stepTitle(step) {
  let title = `${step.actor}.${step.title}(${step.args ? step.args.join(',') : ''})`
  if (title.length > 100) title = `${title.substring(0, 100)}...`
  return title
}

function buildSrt(steps) {
  const sorted = Object.values(steps).sort((a, b) => a.startedAt - b.startedAt)
  let out = ''
  let index = 1
  for (const step of sorted) {
    if (!step.end) continue
    out += `${index}\n${step.start} --> ${step.end}\n${step.title}\n\n`
    index++
  }
  return out
}

function ensureArtifactsObject(test) {
  if (!test.artifacts || Array.isArray(test.artifacts)) test.artifacts = {}
}

function attachJUnitArtifact(test, filePath) {
  const mocha = Container.mocha?.()
  const junit = mocha?.options?.reporterOptions?.['mocha-junit-reporter']
  if (junit?.options?.attachments) {
    test.attachments = test.attachments || []
    test.attachments.push(filePath)
  }
}
