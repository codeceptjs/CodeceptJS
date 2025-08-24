const { expect } = require('expect')
const exec = require('child_process').exec
const { codecept_dir, codecept_run } = require('./consts')
const debug = require('debug')('codeceptjs:tests')
const fs = require('fs')
const path = require('path')

const config_run_config = (config, grep, verbose = false) => `${codecept_run} ${verbose ? '--verbose' : ''} --config ${codecept_dir}/configs/html-reporter-plugin/${config} ${grep ? `--grep "${grep}"` : ''}`

describe('CodeceptJS html-reporter-plugin', function () {
  this.timeout(10000)

  it('should generate HTML report', done => {
    exec(config_run_config('codecept.conf.js'), (err, stdout) => {
      debug(stdout)

      // Check if HTML report file exists
      const reportFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output', 'report.html')
      expect(fs.existsSync(reportFile)).toBe(true)

      // Read and validate HTML report content
      const reportContent = fs.readFileSync(reportFile, 'utf8')
      expect(reportContent).toContain('CodeceptJS Test Report')
      expect(reportContent).toContain('Test Statistics')
      expect(reportContent).toContain('Test Results')

      // Check for specific test features
      expect(reportContent).toContain('HTML Reporter Test') // Feature name
      expect(reportContent).toContain('test with multiple steps') // Scenario name
      expect(reportContent).toContain('test that will fail') // Another scenario
      expect(reportContent).toContain('test that will pass') // Another scenario

      // Validate that stats are included
      expect(reportContent).toMatch(/Total.*Passed.*Failed/s)

      // Check for pie chart functionality
      expect(reportContent).toContain('pie-chart-container')
      expect(reportContent).toContain('statsChart')
      expect(reportContent).toContain('drawPieChart')
      expect(reportContent).toMatch(/window\.chartData\s*=/)

      // Check for enhanced features
      expect(reportContent).toContain('filter-controls')
      expect(reportContent).toContain('statusFilter')
      expect(reportContent).toContain('featureFilter')
      expect(reportContent).toContain('tagFilter')
      expect(reportContent).toContain('retryFilter')
      expect(reportContent).toContain('applyFilters')
      expect(reportContent).toContain('resetFilters')

      // Check for metadata and tags support
      expect(reportContent).toContain('metadata-section')
      expect(reportContent).toContain('tags-section')
      expect(reportContent).toContain('notes-section')
      expect(reportContent).toContain('retry-section')

      // Check for hooks styles (even if not used in this test)
      expect(reportContent).toContain('hooks-section')
      expect(reportContent).toContain('hook-item')

      // Check basic HTML structure
      expect(reportContent).toContain('<!DOCTYPE html>')
      expect(reportContent).toContain('<head>')
      expect(reportContent).toContain('<body>')
      expect(reportContent).toContain('</html>')

      // Should contain CSS and JS
      expect(reportContent).toContain('<style>')
      expect(reportContent).toContain('<script>')

      done()
    })
  })

  it('should export test stats when configured', done => {
    exec(config_run_config('codecept-with-stats.conf.js'), (err, stdout) => {
      debug(stdout)

      // Check if stats export file exists
      const statsFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output', 'test-stats.json')
      expect(fs.existsSync(statsFile)).toBe(true)

      // Read and validate stats export content
      const statsContent = JSON.parse(fs.readFileSync(statsFile, 'utf8'))
      expect(statsContent).toHaveProperty('timestamp')
      expect(statsContent).toHaveProperty('duration')
      expect(statsContent).toHaveProperty('stats')
      expect(statsContent).toHaveProperty('tests')
      expect(statsContent.tests).toBeInstanceOf(Array)
      expect(statsContent.tests.length).toBeGreaterThan(0)

      // Validate test data structure
      const testData = statsContent.tests[0]
      expect(testData).toHaveProperty('id')
      expect(testData).toHaveProperty('title')
      expect(testData).toHaveProperty('state')
      expect(testData).toHaveProperty('duration')

      done()
    })
  })

  it('should track history when configured', done => {
    exec(config_run_config('codecept-with-history.conf.js'), (err, stdout) => {
      debug(stdout)

      // Check if history file exists
      const historyFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output', 'test-history.json')
      expect(fs.existsSync(historyFile)).toBe(true)

      // Read and validate history content
      const historyContent = JSON.parse(fs.readFileSync(historyFile, 'utf8'))
      expect(historyContent).toBeInstanceOf(Array)
      expect(historyContent.length).toBeGreaterThan(0)

      const historyEntry = historyContent[0]
      expect(historyEntry).toHaveProperty('timestamp')
      expect(historyEntry).toHaveProperty('duration')
      expect(historyEntry).toHaveProperty('stats')

      done()
    })
  })

  it('should support BDD/Gherkin scenarios', done => {
    exec(config_run_config('codecept-bdd.conf.js'), (err, stdout) => {
      debug(stdout)

      // Check if HTML report file exists
      const reportFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output', 'bdd-report.html')
      expect(fs.existsSync(reportFile)).toBe(true)

      // Read and validate HTML report content for BDD features
      const reportContent = fs.readFileSync(reportFile, 'utf8')
      
      // Check for BDD-specific elements
      expect(reportContent).toContain('bdd-test') // CSS class for BDD tests
      expect(reportContent).toContain('Scenario:') // BDD scenario prefix
      expect(reportContent).toContain('Feature:') // BDD feature prefix
      expect(reportContent).toContain('Gherkin') // BDD badge
      
      // Check for BDD steps styling
      expect(reportContent).toContain('bdd-steps-section')
      expect(reportContent).toContain('bdd-step-item')
      expect(reportContent).toContain('bdd-keyword')
      expect(reportContent).toContain('bdd-step-text')
      
      // Check for feature information section
      expect(reportContent).toContain('bdd-feature-section')
      expect(reportContent).toContain('feature-info')
      expect(reportContent).toContain('HTML Reporter BDD Test') // Feature name
      
      // Check for BDD-specific CSS styles
      expect(reportContent).toContain('bdd-badge')
      expect(reportContent).toContain('feature-name')
      expect(reportContent).toContain('feature-description')
      
      // Check for test type filter
      expect(reportContent).toContain('typeFilter')
      expect(reportContent).toContain('BDD/Gherkin')
      expect(reportContent).toContain('data-type=')
      
      // Should contain scenario steps with proper keywords
      expect(reportContent).toMatch(/Given|When|Then|And/)

      done()
    })
  })
})
