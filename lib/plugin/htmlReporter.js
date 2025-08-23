const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const crypto = require('crypto')
const { template } = require('../utils')

const event = require('../event')
const output = require('../output')

const defaultConfig = {
  output: global.output_dir || './output',
  reportFileName: 'report.html',
  includeArtifacts: true,
  showSteps: true,
  showSkipped: true,
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
 *      "showSkipped": true
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
    startTime: null,
    endTime: null,
  }
  let currentTestSteps = []

  // Initialize report directory
  const reportDir = path.resolve(options.output)
  mkdirp.sync(reportDir)

  // Track overall test execution
  event.dispatcher.on(event.all.before, () => {
    reportData.startTime = new Date()
    output.plugin('htmlReporter', 'Starting HTML report generation...')
  })

  // Track test start to initialize steps collection
  event.dispatcher.on(event.test.before, test => {
    currentTestSteps = []
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

  // Collect test results
  event.dispatcher.on(event.test.finished, test => {
    reportData.tests.push({
      ...test,
      id: generateTestId(test),
      duration: test.duration || 0,
      steps: [...currentTestSteps], // Copy the steps
      artifacts: test.artifacts || [],
    })
  })

  // Generate final report
  event.dispatcher.on(event.all.result, result => {
    reportData.endTime = new Date()
    reportData.stats = result.stats
    reportData.failures = result.failures || []
    reportData.duration = reportData.endTime - reportData.startTime

    generateHtmlReport(reportData, options)
  })

  function generateTestId(test) {
    return crypto
      .createHash('sha256')
      .update(`${test.parent?.title || 'unknown'}_${test.title}`)
      .digest('hex')
      .substring(0, 8)
  }

  function generateHtmlReport(data, config) {
    const reportPath = path.join(reportDir, config.reportFileName)
    
    const html = template(getHtmlTemplate(), {
      title: 'CodeceptJS Test Report',
      timestamp: data.endTime.toISOString(),
      duration: formatDuration(data.duration),
      stats: JSON.stringify(data.stats),
      statsHtml: generateStatsHtml(data.stats),
      testsHtml: generateTestsHtml(data.tests, config),
      failuresHtml: generateFailuresHtml(data.failures),
      cssStyles: getCssStyles(),
      jsScripts: getJsScripts(),
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
    `
  }

  function generateTestsHtml(tests, config) {
    if (!tests || tests.length === 0) {
      return '<p>No tests found.</p>'
    }

    return tests.map(test => {
      const statusClass = test.state || 'unknown'
      const feature = test.parent?.title || 'Unknown Feature'
      const steps = config.showSteps && test.steps ? generateStepsHtml(test.steps) : ''
      const artifacts = config.includeArtifacts && test.artifacts ? generateArtifactsHtml(test.artifacts) : ''

      return `
        <div class="test-item ${statusClass}" id="test-${test.id}">
          <div class="test-header" onclick="toggleTestDetails('test-${test.id}')">
            <span class="test-status ${statusClass}">●</span>
            <h3 class="test-title">${test.title}</h3>
            <span class="test-feature">${feature}</span>
            <span class="test-duration">${formatDuration(test.duration)}</span>
          </div>
          <div class="test-details" id="details-test-${test.id}">
            ${test.err ? `<div class="error-message"><pre>${escapeHtml(test.err.message || '').replace(/\x1b\[[0-9;]*m/g, '')}</pre></div>` : ''}
            ${steps}
            ${artifacts}
          </div>
        </div>
      `
    }).join('')
  }

  function generateStepsHtml(steps) {
    if (!steps || steps.length === 0) return ''

    const stepsHtml = steps.map(step => {
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
    }).join('')

    return `
      <div class="steps-section">
        <h4>Steps:</h4>
        <div class="steps-list">${stepsHtml}</div>
      </div>
    `
  }

  function generateArtifactsHtml(artifacts) {
    if (!artifacts || artifacts.length === 0) return ''

    const artifactsHtml = artifacts.map(artifact => {
      if (typeof artifact === 'string' && artifact.match(/\.(png|jpg|jpeg|gif)$/i)) {
        const relativePath = path.relative(reportDir, artifact)
        return `<img src="${relativePath}" alt="Screenshot" class="artifact-image" onclick="openImageModal(this.src)"/>`
      }
      return `<div class="artifact-item">${escapeHtml(artifact.toString())}</div>`
    }).join('')

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

    return failures.map((failure, index) => {
      const failureText = failure.toString().replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI escape codes
      return `
        <div class="failure-item">
          <h4>Failure ${index + 1}</h4>
          <pre class="failure-details">${escapeHtml(failureText)}</pre>
        </div>
      `
    }).join('')
  }

  function formatDuration(duration) {
    if (!duration) return '0ms'
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(2)}s`
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
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

        <section class="tests-section">
            <h2>Test Results</h2>
            <div class="tests-container">
                {{testsHtml}}
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

.stats-section, .tests-section, .failures-section {
    background: white;
    margin-bottom: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
}

.stats-section h2, .tests-section h2, .failures-section h2 {
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

.test-status {
    font-size: 1.2rem;
    margin-right: 0.5rem;
}

.test-status.passed { color: #27ae60; }
.test-status.failed { color: #e74c3c; }
.test-status.pending { color: #f39c12; }
.test-status.skipped { color: #95a5a6; }

.test-title {
    flex: 1;
    font-size: 1.1rem;
    font-weight: 500;
}

.test-feature {
    background: #ecf0f1;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #34495e;
    margin-right: 0.5rem;
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

.steps-section, .artifacts-section {
    margin-top: 1rem;
}

.steps-section h4, .artifacts-section h4 {
    color: #34495e;
    margin-bottom: 0.5rem;
    font-size: 1rem;
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

// Initialize - hide failures section if no failures
document.addEventListener('DOMContentLoaded', function() {
    const failuresSection = document.querySelector('.failures-section');
    const failureItems = document.querySelectorAll('.failure-item');
    if (failureItems.length === 0) {
        failuresSection.style.display = 'none';
    }
});
    `
  }
}