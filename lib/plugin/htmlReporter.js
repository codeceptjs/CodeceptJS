const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const crypto = require('crypto')
const { template } = require('../utils')

const event = require('../event')
const output = require('../output')
const Codecept = require('../codecept')

const defaultConfig = {
  output: global.output_dir || './output',
  reportFileName: 'report.html',
  includeArtifacts: true,
  showSteps: true,
  showSkipped: true,
  showMetadata: true,
  showTags: true,
  showRetries: true,
  exportStats: false,
  exportStatsPath: './stats.json',
  keepHistory: false,
  historyPath: './test-history.json',
  maxHistoryEntries: 50,
}

/**
 * HTML Reporter Plugin for CodeceptJS
 *
 * Generates comprehensive HTML reports showing:
 * - Test statistics
 * - Feature/Scenario details
 * - Individual step results
 * - Test artifacts (screenshots, etc.)
 *
 * ## Configuration
 *
 * ```js
 * "plugins": {
 *    "htmlReporter": {
 *      "enabled": true,
 *      "output": "./output",
 *      "reportFileName": "report.html",
 *      "includeArtifacts": true,
 *      "showSteps": true,
 *      "showSkipped": true,
 *      "showMetadata": true,
 *      "showTags": true,
 *      "showRetries": true,
 *      "exportStats": false,
 *      "exportStatsPath": "./stats.json",
 *      "keepHistory": false,
 *      "historyPath": "./test-history.json",
 *      "maxHistoryEntries": 50
 *    }
 * }
 * ```
 */
module.exports = function (config) {
  const options = { ...defaultConfig, ...config }
  let reportData = {
    stats: {},
    tests: [],
    failures: [],
    hooks: [],
    startTime: null,
    endTime: null,
    retries: [],
    config: options,
  }
  let currentTestSteps = []
  let currentTestHooks = []
  let currentBddSteps = [] // Track BDD/Gherkin steps
  let testRetryAttempts = new Map() // Track retry attempts per test
  let currentSuite = null // Track current suite for BDD detection

  // Initialize report directory
  const reportDir = options.output ? path.resolve(global.codecept_dir, options.output) : path.resolve(global.output_dir || './output')
  mkdirp.sync(reportDir)

  // Track overall test execution
  event.dispatcher.on(event.all.before, () => {
    reportData.startTime = new Date()
    output.plugin('htmlReporter', 'Starting HTML report generation...')
  })

  // Track test start to initialize steps and hooks collection
  event.dispatcher.on(event.test.before, test => {
    currentTestSteps = []
    currentTestHooks = []
    currentBddSteps = []

    // Track current suite for BDD detection
    currentSuite = test.parent

    // Track retry attempts
    if (test.retriedTest && test.retriedTest()) {
      const originalTest = test.retriedTest()
      const testId = generateTestId(originalTest)
      if (!testRetryAttempts.has(testId)) {
        testRetryAttempts.set(testId, 0)
      }
      testRetryAttempts.set(testId, testRetryAttempts.get(testId) + 1)
    }
  })

  // Collect step information
  event.dispatcher.on(event.step.started, step => {
    step.htmlReporterStartTime = Date.now()
  })

  event.dispatcher.on(event.step.finished, step => {
    if (step.htmlReporterStartTime) {
      step.duration = Date.now() - step.htmlReporterStartTime
    }
    currentTestSteps.push({
      name: step.name,
      actor: step.actor,
      args: step.args || [],
      status: step.failed ? 'failed' : 'success',
      duration: step.duration || 0,
    })
  })

  // Collect hook information
  event.dispatcher.on(event.hook.started, hook => {
    hook.htmlReporterStartTime = Date.now()
  })

  event.dispatcher.on(event.hook.finished, hook => {
    if (hook.htmlReporterStartTime) {
      hook.duration = Date.now() - hook.htmlReporterStartTime
    }
    const hookInfo = {
      title: hook.title,
      type: hook.type || 'unknown', // before, after, beforeSuite, afterSuite
      status: hook.err ? 'failed' : 'passed',
      duration: hook.duration || 0,
      error: hook.err ? hook.err.message : null,
    }
    currentTestHooks.push(hookInfo)
    reportData.hooks.push(hookInfo)
  })

  // Collect BDD/Gherkin step information
  event.dispatcher.on(event.bddStep.started, step => {
    step.htmlReporterStartTime = Date.now()
  })

  event.dispatcher.on(event.bddStep.finished, step => {
    if (step.htmlReporterStartTime) {
      step.duration = Date.now() - step.htmlReporterStartTime
    }
    currentBddSteps.push({
      keyword: step.actor || 'Given',
      text: step.name,
      status: step.failed ? 'failed' : 'success',
      duration: step.duration || 0,
      comment: step.comment,
    })
  })

  // Collect test results
  event.dispatcher.on(event.test.finished, test => {
    const testId = generateTestId(test)
    const retryAttempts = testRetryAttempts.get(testId) || 0

    // Detect if this is a BDD/Gherkin test
    const isBddTest = isBddGherkinTest(test, currentSuite)
    const steps = isBddTest ? currentBddSteps : currentTestSteps
    const featureInfo = isBddTest ? getBddFeatureInfo(test, currentSuite) : null

    reportData.tests.push({
      ...test,
      id: testId,
      duration: test.duration || 0,
      steps: [...steps], // Copy the steps (BDD or regular)
      hooks: [...currentTestHooks], // Copy the hooks
      artifacts: test.artifacts || [],
      tags: test.tags || [],
      meta: test.meta || {},
      opts: test.opts || {},
      notes: test.notes || [],
      retryAttempts: retryAttempts,
      uid: test.uid,
      isBdd: isBddTest,
      feature: featureInfo,
    })

    // If this was a retry, track the retry information
    if (retryAttempts > 0) {
      reportData.retries.push({
        testId: testId,
        testTitle: test.title,
        attempts: retryAttempts,
        finalState: test.state,
        duration: test.duration || 0,
      })
    }
  })

  // Generate final report
  event.dispatcher.on(event.all.result, result => {
    reportData.endTime = new Date()
    reportData.stats = result.stats
    reportData.failures = result.failures || []
    reportData.duration = reportData.endTime - reportData.startTime

    generateHtmlReport(reportData, options)

    // Export stats if configured
    if (options.exportStats) {
      exportTestStats(reportData, options)
    }

    // Save history if configured
    if (options.keepHistory) {
      saveTestHistory(reportData, options)
    }
  })

  function generateTestId(test) {
    return crypto
      .createHash('sha256')
      .update(`${test.parent?.title || 'unknown'}_${test.title}`)
      .digest('hex')
      .substring(0, 8)
  }

  function isBddGherkinTest(test, suite) {
    // Check if the suite has BDD/Gherkin properties
    return !!(suite && (suite.feature || suite.file?.endsWith('.feature')))
  }

  function getBddFeatureInfo(test, suite) {
    if (!suite) return null

    return {
      name: suite.feature?.name || suite.title,
      description: suite.feature?.description || suite.comment || '',
      language: suite.feature?.language || 'en',
      tags: suite.tags || [],
      file: suite.file || '',
    }
  }

  function exportTestStats(data, config) {
    const statsPath = path.resolve(reportDir, config.exportStatsPath)

    const exportData = {
      timestamp: data.endTime.toISOString(),
      duration: data.duration,
      stats: data.stats,
      retries: data.retries,
      testCount: data.tests.length,
      passedTests: data.tests.filter(t => t.state === 'passed').length,
      failedTests: data.tests.filter(t => t.state === 'failed').length,
      pendingTests: data.tests.filter(t => t.state === 'pending').length,
      tests: data.tests.map(test => ({
        id: test.id,
        title: test.title,
        feature: test.parent?.title || 'Unknown',
        state: test.state,
        duration: test.duration,
        tags: test.tags,
        meta: test.meta,
        retryAttempts: test.retryAttempts,
        uid: test.uid,
      })),
    }

    try {
      fs.writeFileSync(statsPath, JSON.stringify(exportData, null, 2))
      output.print(`Test stats exported to: ${statsPath}`)
    } catch (error) {
      output.print(`Failed to export test stats: ${error.message}`)
    }
  }

  function saveTestHistory(data, config) {
    const historyPath = path.resolve(reportDir, config.historyPath)
    let history = []

    // Load existing history
    try {
      if (fs.existsSync(historyPath)) {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf8'))
      }
    } catch (error) {
      output.print(`Failed to load existing history: ${error.message}`)
    }

    // Add current run to history
    history.unshift({
      timestamp: data.endTime.toISOString(),
      duration: data.duration,
      stats: data.stats,
      retries: data.retries.length,
      testCount: data.tests.length,
    })

    // Limit history entries
    if (history.length > config.maxHistoryEntries) {
      history = history.slice(0, config.maxHistoryEntries)
    }

    try {
      fs.writeFileSync(historyPath, JSON.stringify(history, null, 2))
      output.print(`Test history saved to: ${historyPath}`)
    } catch (error) {
      output.print(`Failed to save test history: ${error.message}`)
    }
  }

  async function generateHtmlReport(data, config) {
    const reportPath = path.join(reportDir, config.reportFileName)

    // Load history if available
    let history = []
    if (config.keepHistory) {
      const historyPath = path.resolve(reportDir, config.historyPath)
      try {
        if (fs.existsSync(historyPath)) {
          history = JSON.parse(fs.readFileSync(historyPath, 'utf8')).slice(0, 10) // Last 10 runs for chart
        }
      } catch (error) {
        output.print(`Failed to load history for report: ${error.message}`)
      }
    }

    // Get system information
    const systemInfo = await getSystemInfo()

    const html = template(getHtmlTemplate(), {
      title: 'CodeceptJS Test Report',
      timestamp: data.endTime.toISOString(),
      duration: formatDuration(data.duration),
      stats: JSON.stringify(data.stats),
      history: JSON.stringify(history),
      statsHtml: generateStatsHtml(data.stats),
      testsHtml: generateTestsHtml(data.tests, config),
      failuresHtml: generateFailuresHtml(data.failures),
      retriesHtml: config.showRetries ? generateRetriesHtml(data.retries) : '',
      cssStyles: getCssStyles(),
      jsScripts: getJsScripts(),
      showRetries: config.showRetries ? 'block' : 'none',
      showHistory: config.keepHistory && history.length > 0 ? 'block' : 'none',
      failuresDisplay: data.failures && data.failures.length > 0 ? 'block' : 'none',
      codeceptVersion: Codecept.version(),
      systemInfoHtml: generateSystemInfoHtml(systemInfo),
      codeceptLogo: getCodeceptLogo(),
    })

    fs.writeFileSync(reportPath, html)
    output.print(`HTML Report saved to: ${reportPath}`)
  }

  function generateStatsHtml(stats) {
    const passed = stats.passes || 0
    const failed = stats.failures || 0
    const pending = stats.pending || 0
    const total = stats.tests || 0

    return `
      <div class="stats-cards">
        <div class="stat-card total">
          <h3>Total</h3>
          <span class="stat-number">${total}</span>
        </div>
        <div class="stat-card passed">
          <h3>Passed</h3>
          <span class="stat-number">${passed}</span>
        </div>
        <div class="stat-card failed">
          <h3>Failed</h3>
          <span class="stat-number">${failed}</span>
        </div>
        <div class="stat-card pending">
          <h3>Pending</h3>
          <span class="stat-number">${pending}</span>
        </div>
      </div>
      <div class="pie-chart-container">
        <canvas id="statsChart" width="300" height="300"></canvas>
        <script>
          // Pie chart data will be rendered by JavaScript
          window.chartData = {
            passed: ${passed},
            failed: ${failed},
            pending: ${pending}
          };
        </script>
      </div>
    `
  }

  function generateTestsHtml(tests, config) {
    if (!tests || tests.length === 0) {
      return '<p>No tests found.</p>'
    }

    return tests
      .map(test => {
        const statusClass = test.state || 'unknown'
        const feature = test.isBdd && test.feature ? test.feature.name : (test.parent?.title || 'Unknown Feature')
        const steps = config.showSteps && test.steps ? (test.isBdd ? generateBddStepsHtml(test.steps) : generateStepsHtml(test.steps)) : ''
        const featureDetails = test.isBdd && test.feature ? generateBddFeatureHtml(test.feature) : ''
        const hooks = test.hooks && test.hooks.length > 0 ? generateHooksHtml(test.hooks) : ''
        const artifacts = config.includeArtifacts && test.artifacts ? generateArtifactsHtml(test.artifacts) : ''
        const metadata = config.showMetadata && (test.meta || test.opts) ? generateMetadataHtml(test.meta, test.opts) : ''
        const tags = config.showTags && test.tags && test.tags.length > 0 ? generateTagsHtml(test.tags) : ''
        const retries = config.showRetries && test.retryAttempts > 0 ? generateTestRetryHtml(test.retryAttempts) : ''
        const notes = test.notes && test.notes.length > 0 ? generateNotesHtml(test.notes) : ''

        return `
        <div class="test-item ${statusClass}${test.isBdd ? ' bdd-test' : ''}" id="test-${test.id}" data-feature="${escapeHtml(feature)}" data-status="${statusClass}" data-tags="${(test.tags || []).join(',')}" data-retries="${test.retryAttempts || 0}" data-type="${test.isBdd ? 'bdd' : 'regular'}">
          <div class="test-header" onclick="toggleTestDetails('test-${test.id}')">
            <span class="test-status ${statusClass}">●</span>
            <div class="test-info">
              <h3 class="test-title">${test.isBdd ? `Scenario: ${test.title}` : test.title}</h3>
              <div class="test-meta-line">
                <span class="test-feature">${test.isBdd ? 'Feature: ' : ''}${feature}</span>
                ${test.uid ? `<span class="test-uid">${test.uid}</span>` : ''}
                <span class="test-duration">${formatDuration(test.duration)}</span>
                ${test.retryAttempts > 0 ? `<span class="retry-badge">${test.retryAttempts} retries</span>` : ''}
                ${test.isBdd ? '<span class="bdd-badge">Gherkin</span>' : ''}
              </div>
            </div>
          </div>
          <div class="test-details" id="details-test-${test.id}">
            ${test.err ? `<div class="error-message"><pre>${escapeHtml(test.err.message || '').replace(/\x1b\[[0-9;]*m/g, '')}</pre></div>` : ''}
            ${featureDetails}
            ${tags}
            ${metadata}
            ${retries}
            ${notes}
            ${hooks}
            ${steps}
            ${artifacts}
          </div>
        </div>
      `
      })
      .join('')
  }

  function generateStepsHtml(steps) {
    if (!steps || steps.length === 0) return ''

    const stepsHtml = steps
      .map(step => {
        const statusClass = step.status || 'unknown'
        const args = step.args ? step.args.map(arg => JSON.stringify(arg)).join(', ') : ''
        const stepName = step.name || 'unknown step'
        const actor = step.actor || 'I'

        return `
        <div class="step-item ${statusClass}">
          <span class="step-status ${statusClass}">●</span>
          <span class="step-title">${actor}.${stepName}(${args})</span>
          <span class="step-duration">${formatDuration(step.duration)}</span>
        </div>
      `
      })
      .join('')

    return `
      <div class="steps-section">
        <h4>Steps:</h4>
        <div class="steps-list">${stepsHtml}</div>
      </div>
    `
  }

  function generateBddStepsHtml(steps) {
    if (!steps || steps.length === 0) return ''

    const stepsHtml = steps
      .map(step => {
        const statusClass = step.status || 'unknown'
        const keyword = step.keyword || 'Given'
        const text = step.text || ''
        const comment = step.comment ? `<div class="step-comment">${escapeHtml(step.comment)}</div>` : ''

        return `
        <div class="bdd-step-item ${statusClass}">
          <span class="step-status ${statusClass}">●</span>
          <span class="bdd-keyword">${keyword}</span>
          <span class="bdd-step-text">${escapeHtml(text)}</span>
          <span class="step-duration">${formatDuration(step.duration)}</span>
          ${comment}
        </div>
      `
      })
      .join('')

    return `
      <div class="bdd-steps-section">
        <h4>Scenario Steps:</h4>
        <div class="bdd-steps-list">${stepsHtml}</div>
      </div>
    `
  }

  function generateBddFeatureHtml(feature) {
    if (!feature) return ''

    const description = feature.description ? `<div class="feature-description">${escapeHtml(feature.description)}</div>` : ''
    const featureTags = feature.tags && feature.tags.length > 0 ? 
      `<div class="feature-tags">${feature.tags.map(tag => `<span class="feature-tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''

    return `
      <div class="bdd-feature-section">
        <h4>Feature Information:</h4>
        <div class="feature-info">
          <div class="feature-name">Feature: ${escapeHtml(feature.name)}</div>
          ${description}
          ${featureTags}
          ${feature.file ? `<div class="feature-file">File: ${escapeHtml(feature.file)}</div>` : ''}
        </div>
      </div>
    `
  }

  function generateHooksHtml(hooks) {
    if (!hooks || hooks.length === 0) return ''

    const hooksHtml = hooks
      .map(hook => {
        const statusClass = hook.status || 'unknown'
        const hookType = hook.type || 'hook'
        const hookTitle = hook.title || `${hookType} hook`

        return `
        <div class="hook-item ${statusClass}">
          <span class="hook-status ${statusClass}">●</span>
          <span class="hook-title">${hookType}: ${hookTitle}</span>
          <span class="hook-duration">${formatDuration(hook.duration)}</span>
          ${hook.error ? `<div class="hook-error">${escapeHtml(hook.error)}</div>` : ''}
        </div>
      `
      })
      .join('')

    return `
      <div class="hooks-section">
        <h4>Hooks:</h4>
        <div class="hooks-list">${hooksHtml}</div>
      </div>
    `
  }

  function generateMetadataHtml(meta, opts) {
    const allMeta = { ...(opts || {}), ...(meta || {}) }
    if (!allMeta || Object.keys(allMeta).length === 0) return ''

    const metaHtml = Object.entries(allMeta)
      .filter(([key, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        const displayValue = typeof value === 'object' ? JSON.stringify(value) : value.toString()
        return `<div class="meta-item"><span class="meta-key">${escapeHtml(key)}:</span> <span class="meta-value">${escapeHtml(displayValue)}</span></div>`
      })
      .join('')

    return `
      <div class="metadata-section">
        <h4>Metadata:</h4>
        <div class="metadata-list">${metaHtml}</div>
      </div>
    `
  }

  function generateTagsHtml(tags) {
    if (!tags || tags.length === 0) return ''

    const tagsHtml = tags.map(tag => `<span class="test-tag">${escapeHtml(tag)}</span>`).join('')

    return `
      <div class="tags-section">
        <h4>Tags:</h4>
        <div class="tags-list">${tagsHtml}</div>
      </div>
    `
  }

  function generateNotesHtml(notes) {
    if (!notes || notes.length === 0) return ''

    const notesHtml = notes.map(note => `<div class="note-item note-${note.type || 'info'}"><span class="note-type">${note.type || 'info'}:</span> <span class="note-text">${escapeHtml(note.text)}</span></div>`).join('')

    return `
      <div class="notes-section">
        <h4>Notes:</h4>
        <div class="notes-list">${notesHtml}</div>
      </div>
    `
  }

  function generateTestRetryHtml(retryAttempts) {
    return `
      <div class="retry-section">
        <h4>Retry Information:</h4>
        <div class="retry-info">
          <span class="retry-count">Total retry attempts: <strong>${retryAttempts}</strong></span>
        </div>
      </div>
    `
  }

  function generateArtifactsHtml(artifacts) {
    if (!artifacts || artifacts.length === 0) return ''

    const artifactsHtml = artifacts
      .map(artifact => {
        if (typeof artifact === 'string' && artifact.match(/\.(png|jpg|jpeg|gif)$/i)) {
          const relativePath = path.relative(reportDir, artifact)
          return `<img src="${relativePath}" alt="Screenshot" class="artifact-image" onclick="openImageModal(this.src)"/>`
        }
        return `<div class="artifact-item">${escapeHtml(artifact.toString())}</div>`
      })
      .join('')

    return `
      <div class="artifacts-section">
        <h4>Artifacts:</h4>
        <div class="artifacts-list">${artifactsHtml}</div>
      </div>
    `
  }

  function generateFailuresHtml(failures) {
    if (!failures || failures.length === 0) {
      return '<p>No failures.</p>'
    }

    return failures
      .map((failure, index) => {
        const failureText = failure.toString().replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI escape codes
        return `
        <div class="failure-item">
          <h4>Failure ${index + 1}</h4>
          <pre class="failure-details">${escapeHtml(failureText)}</pre>
        </div>
      `
      })
      .join('')
  }

  function generateRetriesHtml(retries) {
    if (!retries || retries.length === 0) {
      return '<p>No retried tests.</p>'
    }

    return retries
      .map(
        retry => `
        <div class="retry-item">
          <h4>${retry.testTitle}</h4>
          <div class="retry-details">
            <span>Attempts: <strong>${retry.attempts}</strong></span>
            <span>Final State: <span class="status-badge ${retry.finalState}">${retry.finalState}</span></span>
            <span>Duration: ${formatDuration(retry.duration)}</span>
          </div>
        </div>
      `,
      )
      .join('')
  }

  function formatDuration(duration) {
    if (!duration) return '0ms'
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(2)}s`
  }

  function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
  }

  function getHtmlTemplate() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>{{cssStyles}}</style>
</head>
<body>
    <header class="report-header">
        <h1>{{title}}</h1>
        <div class="report-meta">
            <span>Generated: {{timestamp}}</span>
            <span>Duration: {{duration}}</span>
        </div>
    </header>

    <main class="report-content">
        <section class="stats-section">
            <h2>Test Statistics</h2>
            {{statsHtml}}
        </section>

        <section class="history-section" style="display: {{showHistory}};">
            <h2>Test History</h2>
            <div class="history-chart-container">
                <canvas id="historyChart" width="800" height="300"></canvas>
            </div>
        </section>

        <section class="filters-section">
            <h2>Filters</h2>
            <div class="filter-controls">
                <div class="filter-group">
                    <label>Status:</label>
                    <select id="statusFilter" multiple>
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                        <option value="pending">Pending</option>
                        <option value="skipped">Skipped</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Feature:</label>
                    <input type="text" id="featureFilter" placeholder="Filter by feature...">
                </div>
                <div class="filter-group">
                    <label>Tags:</label>
                    <input type="text" id="tagFilter" placeholder="Filter by tags...">
                </div>
                <div class="filter-group">
                    <label>Retries:</label>
                    <select id="retryFilter">
                        <option value="all">All</option>
                        <option value="retried">With Retries</option>
                        <option value="no-retries">No Retries</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Test Type:</label>
                    <select id="typeFilter">
                        <option value="all">All</option>
                        <option value="bdd">BDD/Gherkin</option>
                        <option value="regular">Regular</option>
                    </select>
                </div>
                <button onclick="resetFilters()">Reset Filters</button>
            </div>
        </section>

        <section class="tests-section">
            <h2>Test Results</h2>
            <div class="tests-container">
                {{testsHtml}}
            </div>
        </section>

        <section class="retries-section" style="display: {{showRetries}};">
            <h2>Test Retries</h2>
            <div class="retries-container">
                {{retriesHtml}}
            </div>
        </section>

        <section class="failures-section" style="display: {{failuresDisplay}};">
            <h2>Failures</h2>
            <div class="failures-container">
                {{failuresHtml}}
            </div>
        </section>
    </main>

    <!-- Modal for images -->
    <div id="imageModal" class="modal" onclick="closeImageModal()">
        <img id="modalImage" src="" alt="Enlarged screenshot"/>
    </div>

    <script>
        window.testData = {
            stats: {{stats}},
            history: {{history}}
        };
    </script>
    <script>{{jsScripts}}</script>
</body>
</html>
    `
  }

  function getCssStyles() {
    return `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
}

.report-header {
    background: #2c3e50;
    color: white;
    padding: 2rem 1rem;
    text-align: center;
}

.report-header h1 {
    margin-bottom: 0.5rem;
    font-size: 2.5rem;
}

.report-meta {
    font-size: 0.9rem;
    opacity: 0.8;
}

.report-meta span {
    margin: 0 1rem;
}

.report-content {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 1rem;
}

.stats-section, .tests-section, .failures-section, .retries-section, .filters-section, .history-section {
    background: white;
    margin-bottom: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
}

.stats-section h2, .tests-section h2, .failures-section h2, .retries-section h2, .filters-section h2, .history-section h2 {
    background: #34495e;
    color: white;
    padding: 1rem;
    margin: 0;
}

.stats-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
}

.stat-card {
    flex: 1;
    min-width: 150px;
    padding: 1rem;
    text-align: center;
    border-radius: 4px;
    color: white;
}

.stat-card.total { background: #3498db; }
.stat-card.passed { background: #27ae60; }
.stat-card.failed { background: #e74c3c; }
.stat-card.pending { background: #f39c12; }

.stat-card h3 {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
}

.stat-number {
    font-size: 2rem;
    font-weight: bold;
}

.pie-chart-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem 1rem;
    background: white;
    margin: 1rem 0;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

#statsChart {
    max-width: 100%;
    height: auto;
}

.test-item {
    border-bottom: 1px solid #eee;
    margin: 0;
}

.test-item:last-child {
    border-bottom: none;
}

.test-header {
    display: flex;
    align-items: center;
    padding: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
}

.test-header:hover {
    background-color: #f8f9fa;
}

.test-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.test-meta-line {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
}

.test-status {
    font-size: 1.2rem;
    margin-right: 0.5rem;
}

.test-status.passed { color: #27ae60; }
.test-status.failed { color: #e74c3c; }
.test-status.pending { color: #f39c12; }
.test-status.skipped { color: #95a5a6; }

.test-title {
    font-size: 1.1rem;
    font-weight: 500;
    margin: 0;
}

.test-feature {
    background: #ecf0f1;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #34495e;
}

.test-uid {
    background: #e8f4fd;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    color: #2980b9;
    font-family: monospace;
}

.retry-badge {
    background: #f39c12;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: bold;
}

.test-duration {
    font-size: 0.8rem;
    color: #7f8c8d;
}

.test-details {
    display: none;
    padding: 1rem;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
}

.error-message {
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.error-message pre {
    color: #c0392b;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.steps-section, .artifacts-section, .hooks-section {
    margin-top: 1rem;
}

.steps-section h4, .artifacts-section h4, .hooks-section h4 {
    color: #34495e;
    margin-bottom: 0.5rem;
    font-size: 1rem;
}

.hook-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #ecf0f1;
}

.hook-item:last-child {
    border-bottom: none;
}

.hook-status {
    margin-right: 0.5rem;
}

.hook-status.passed { color: #27ae60; }
.hook-status.failed { color: #e74c3c; }

.hook-title {
    flex: 1;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    font-weight: bold;
}

.hook-duration {
    font-size: 0.8rem;
    color: #7f8c8d;
}

.hook-error {
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c0392b;
    font-size: 0.8rem;
}

.step-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #ecf0f1;
}

.step-item:last-child {
    border-bottom: none;
}

.step-status {
    margin-right: 0.5rem;
}

.step-status.success { color: #27ae60; }
.step-status.failed { color: #e74c3c; }

.step-title {
    flex: 1;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
}

.step-duration {
    font-size: 0.8rem;
    color: #7f8c8d;
}

.artifacts-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.artifact-image {
    max-width: 200px;
    max-height: 150px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: transform 0.2s;
}

.artifact-image:hover {
    transform: scale(1.05);
}

.artifact-item {
    background: #ecf0f1;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
}

.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.8);
    cursor: pointer;
}

.modal img {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 90%;
    max-height: 90%;
    border-radius: 4px;
}

.failure-item {
    padding: 1rem;
    margin-bottom: 1rem;
    border: 1px solid #fcc;
    border-radius: 4px;
    background: #fee;
}

.failure-item h4 {
    color: #c0392b;
    margin-bottom: 0.5rem;
}

.failure-details {
    color: #333;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    white-space: pre-wrap;
    word-wrap: break-word;
}

/* Filter Controls */
.filter-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
    background: #f8f9fa;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.filter-group label {
    font-size: 0.9rem;
    font-weight: 500;
    color: #34495e;
}

.filter-group input,
.filter-group select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
    min-width: 150px;
}

.filter-group select[multiple] {
    height: auto;
    min-height: 80px;
}

.filter-controls button {
    padding: 0.5rem 1rem;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    align-self: flex-end;
}

.filter-controls button:hover {
    background: #2980b9;
}

/* Test Tags */
.tags-section, .metadata-section, .notes-section, .retry-section {
    margin-top: 1rem;
}

.tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.test-tag {
    background: #3498db;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.8rem;
}

/* Metadata */
.metadata-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.meta-item {
    padding: 0.5rem;
    background: #f8f9fa;
    border-radius: 4px;
    border-left: 3px solid #3498db;
}

.meta-key {
    font-weight: bold;
    color: #2c3e50;
}

.meta-value {
    color: #34495e;
    font-family: monospace;
}

/* Notes */
.notes-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.note-item {
    padding: 0.5rem;
    border-radius: 4px;
    border-left: 3px solid #95a5a6;
}

.note-item.note-info {
    background: #e8f4fd;
    border-left-color: #3498db;
}

.note-item.note-warning {
    background: #fef9e7;
    border-left-color: #f39c12;
}

.note-item.note-error {
    background: #fee;
    border-left-color: #e74c3c;
}

.note-item.note-retry {
    background: #f0f8e8;
    border-left-color: #27ae60;
}

.note-type {
    font-weight: bold;
    text-transform: uppercase;
    font-size: 0.8rem;
}

/* Retry Information */
.retry-info {
    padding: 0.5rem;
    background: #fef9e7;
    border-radius: 4px;
    border-left: 3px solid #f39c12;
}

.retry-count {
    color: #d68910;
    font-weight: 500;
}

/* Retries Section */
.retry-item {
    padding: 1rem;
    margin-bottom: 1rem;
    border: 1px solid #f39c12;
    border-radius: 4px;
    background: #fef9e7;
}

.retry-item h4 {
    color: #d68910;
    margin-bottom: 0.5rem;
}

.retry-details {
    display: flex;
    gap: 1rem;
    align-items: center;
    font-size: 0.9rem;
}

.status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: uppercase;
}

.status-badge.passed {
    background: #27ae60;
    color: white;
}

.status-badge.failed {
    background: #e74c3c;
    color: white;
}

.status-badge.pending {
    background: #f39c12;
    color: white;
}

/* History Chart */
.history-chart-container {
    padding: 2rem 1rem;
    display: flex;
    justify-content: center;
}

#historyChart {
    max-width: 100%;
    height: auto;
}

/* Hidden items for filtering */
.test-item.filtered-out {
    display: none !important;
}

/* BDD/Gherkin specific styles */
.bdd-test {
    border-left: 4px solid #8e44ad;
}

.bdd-badge {
    background: #8e44ad;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: bold;
}

.bdd-feature-section {
    margin-top: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-left: 4px solid #8e44ad;
    border-radius: 4px;
}

.feature-name {
    font-weight: bold;
    font-size: 1.1rem;
    color: #8e44ad;
    margin-bottom: 0.5rem;
}

.feature-description {
    color: #34495e;
    font-style: italic;
    margin: 0.5rem 0;
    padding: 0.5rem;
    background: white;
    border-radius: 4px;
}

.feature-file {
    font-size: 0.8rem;
    color: #7f8c8d;
    margin-top: 0.5rem;
}

.feature-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin: 0.5rem 0;
}

.feature-tag {
    background: #8e44ad;
    color: white;
    padding: 0.2rem 0.4rem;
    border-radius: 8px;
    font-size: 0.7rem;
}

.bdd-steps-section {
    margin-top: 1rem;
}

.bdd-steps-section h4 {
    color: #8e44ad;
    margin-bottom: 0.5rem;
    font-size: 1rem;
}

.bdd-step-item {
    display: flex;
    align-items: flex-start;
    padding: 0.5rem 0;
    border-bottom: 1px solid #ecf0f1;
    font-family: 'Segoe UI', sans-serif;
}

.bdd-step-item:last-child {
    border-bottom: none;
}

.bdd-keyword {
    font-weight: bold;
    color: #8e44ad;
    margin-right: 0.5rem;
    min-width: 60px;
    text-align: left;
}

.bdd-step-text {
    flex: 1;
    color: #2c3e50;
    margin-right: 0.5rem;
}

.step-comment {
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    color: #6c757d;
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    white-space: pre-wrap;
}

@media (max-width: 768px) {
    .stats-cards {
        flex-direction: column;
    }
    
    .test-header {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }
    
    .test-feature, .test-duration {
        align-self: flex-start;
    }
}
    `
  }

  function getJsScripts() {
    return `
function toggleTestDetails(testId) {
    const details = document.getElementById('details-' + testId);
    if (details.style.display === 'none' || details.style.display === '') {
        details.style.display = 'block';
    } else {
        details.style.display = 'none';
    }
}

function openImageModal(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modalImg.src = src;
    modal.style.display = 'block';
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
}

// Filter functionality
function applyFilters() {
    const statusFilter = Array.from(document.getElementById('statusFilter').selectedOptions).map(opt => opt.value);
    const featureFilter = document.getElementById('featureFilter').value.toLowerCase();
    const tagFilter = document.getElementById('tagFilter').value.toLowerCase();
    const retryFilter = document.getElementById('retryFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;

    const testItems = document.querySelectorAll('.test-item');

    testItems.forEach(item => {
        let shouldShow = true;

        // Status filter
        if (statusFilter.length > 0) {
            const testStatus = item.dataset.status;
            if (!statusFilter.includes(testStatus)) {
                shouldShow = false;
            }
        }

        // Feature filter
        if (featureFilter && shouldShow) {
            const feature = (item.dataset.feature || '').toLowerCase();
            if (!feature.includes(featureFilter)) {
                shouldShow = false;
            }
        }

        // Tag filter
        if (tagFilter && shouldShow) {
            const tags = (item.dataset.tags || '').toLowerCase();
            if (!tags.includes(tagFilter)) {
                shouldShow = false;
            }
        }

        // Retry filter
        if (retryFilter !== 'all' && shouldShow) {
            const retries = parseInt(item.dataset.retries || '0');
            if (retryFilter === 'retried' && retries === 0) {
                shouldShow = false;
            } else if (retryFilter === 'no-retries' && retries > 0) {
                shouldShow = false;
            }
        }

        // Test type filter (BDD/Gherkin vs Regular)
        if (typeFilter !== 'all' && shouldShow) {
            const testType = item.dataset.type || 'regular';
            if (typeFilter !== testType) {
                shouldShow = false;
            }
        }

        if (shouldShow) {
            item.classList.remove('filtered-out');
        } else {
            item.classList.add('filtered-out');
        }
    });

    updateFilteredStats();
}

function resetFilters() {
    document.getElementById('statusFilter').selectedIndex = -1;
    document.getElementById('featureFilter').value = '';
    document.getElementById('tagFilter').value = '';
    document.getElementById('retryFilter').value = 'all';
    document.getElementById('typeFilter').value = 'all';
    
    document.querySelectorAll('.test-item').forEach(item => {
        item.classList.remove('filtered-out');
    });

    updateFilteredStats();
}

function updateFilteredStats() {
    const visibleTests = document.querySelectorAll('.test-item:not(.filtered-out)');
    const totalVisible = visibleTests.length;
    
    // Update the title to show filtered count
    const testsSection = document.querySelector('.tests-section h2');
    const totalTests = document.querySelectorAll('.test-item').length;
    
    if (totalVisible !== totalTests) {
        testsSection.textContent = 'Test Results (' + totalVisible + ' of ' + totalTests + ' shown)';
    } else {
        testsSection.textContent = 'Test Results';
    }
}

// Draw pie chart using canvas
function drawPieChart() {
    const canvas = document.getElementById('statsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const data = window.chartData;
    
    if (!data) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    const total = data.passed + data.failed + data.pending;
    if (total === 0) {
        // Draw empty circle for no tests
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = '#888';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No Tests', centerX, centerY);
        return;
    }
    
    let currentAngle = -Math.PI / 2; // Start from top
    
    // Draw passed segment
    if (data.passed > 0) {
        const angle = (data.passed / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
        ctx.closePath();
        ctx.fillStyle = '#27ae60';
        ctx.fill();
        currentAngle += angle;
    }
    
    // Draw failed segment
    if (data.failed > 0) {
        const angle = (data.failed / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
        ctx.closePath();
        ctx.fillStyle = '#e74c3c';
        ctx.fill();
        currentAngle += angle;
    }
    
    // Draw pending segment
    if (data.pending > 0) {
        const angle = (data.pending / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
        ctx.closePath();
        ctx.fillStyle = '#f39c12';
        ctx.fill();
    }
    
    // Add legend
    const legendY = centerY + radius + 40;
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    
    let legendX = centerX - 120;
    
    // Passed legend
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(legendX, legendY, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText('Passed (' + data.passed + ')', legendX + 20, legendY + 12);
    
    // Failed legend
    legendX += 100;
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(legendX, legendY, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText('Failed (' + data.failed + ')', legendX + 20, legendY + 12);
    
    // Pending legend
    if (data.pending > 0) {
        legendX += 90;
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(legendX, legendY, 15, 15);
        ctx.fillStyle = '#333';
        ctx.fillText('Pending (' + data.pending + ')', legendX + 20, legendY + 12);
    }
}

// Draw history chart
function drawHistoryChart() {
    const canvas = document.getElementById('historyChart');
    if (!canvas || !window.testData.history || window.testData.history.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const history = window.testData.history.slice().reverse(); // Most recent last
    
    const padding = 50;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Find max values
    const maxTests = Math.max(...history.map(h => h.stats.tests || 0));
    const maxDuration = Math.max(...history.map(h => h.duration || 0));
    
    if (maxTests === 0) return;
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw grid lines
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
        const y = padding + (chartHeight * i / 5);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
    }
    
    // Draw pass/fail rates
    const stepX = chartWidth / (history.length - 1);
    
    // Draw passed tests line
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 3;
    ctx.beginPath();
    history.forEach((run, index) => {
        const x = padding + (index * stepX);
        const y = canvas.height - padding - ((run.stats.passes || 0) / maxTests) * chartHeight;
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    // Draw failed tests line
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    history.forEach((run, index) => {
        const x = padding + (index * stepX);
        const y = canvas.height - padding - ((run.stats.failures || 0) / maxTests) * chartHeight;
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    // Add labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = Math.round((maxTests * i) / 5);
        const y = canvas.height - padding - (chartHeight * i / 5);
        ctx.fillText(value.toString(), padding - 10, y + 4);
    }
    
    // Legend
    ctx.textAlign = 'left';
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(padding, 20, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText('Passed Tests', padding + 20, 32);
    
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(padding + 120, 20, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText('Failed Tests', padding + 140, 32);
}

// Initialize - hide failures section if no failures and draw charts
document.addEventListener('DOMContentLoaded', function() {
    const failuresSection = document.querySelector('.failures-section');
    const failureItems = document.querySelectorAll('.failure-item');
    if (failureItems.length === 0) {
        failuresSection.style.display = 'none';
    }
    
    // Draw charts
    drawPieChart();
    drawHistoryChart();
    
    // Set up filter event listeners
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('featureFilter').addEventListener('input', applyFilters);
    document.getElementById('tagFilter').addEventListener('input', applyFilters);
    document.getElementById('retryFilter').addEventListener('change', applyFilters);
    document.getElementById('typeFilter').addEventListener('change', applyFilters);
});
    `
  }
}
