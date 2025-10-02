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

  it('should display correct feature names in worker mode', done => {
    // Test for the "Unknown Feature" fix when running with workers
    exec(config_run_config('codecept.conf.js') + ' --workers 2', (err, stdout) => {
      debug(stdout)

      const reportFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output', 'report.html')
      expect(fs.existsSync(reportFile)).toBe(true)

      const reportContent = fs.readFileSync(reportFile, 'utf8')
      
      // Should NOT contain "Unknown Feature" - all tests should have proper feature names
      expect(reportContent).not.toContain('Unknown Feature')
      
      // Should contain the actual feature name
      expect(reportContent).toContain('HTML Reporter Test')
      
      // Check that feature names are properly set in data attributes
      expect(reportContent).toMatch(/data-feature="[^"]+HTML Reporter Test[^"]*"/)

      done()
    })
  })

  it('should preserve step details for all tests including worker runs', done => {
    exec(config_run_config('codecept.conf.js') + ' --workers 2', (err, stdout) => {
      debug(stdout)

      const reportFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output', 'report.html')
      const reportContent = fs.readFileSync(reportFile, 'utf8')
      
      // Check that steps section exists and is populated
      expect(reportContent).toContain('steps-section')
      expect(reportContent).toContain('step-item')
      expect(reportContent).toContain('amInPath')
      expect(reportContent).toContain('seeFile')
      
      // Steps should be visible even if feature name was initially unknown
      expect(reportContent).toMatch(/step-title[^>]*>.*amInPath/s)
      expect(reportContent).toMatch(/step-title[^>]*>.*seeFile/s)

      done()
    })
  })

  it('should render high-resolution test history chart', done => {
    exec(config_run_config('codecept-with-history.conf.js'), (err, stdout) => {
      debug(stdout)

      const reportFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output', 'report.html')
      const reportContent = fs.readFileSync(reportFile, 'utf8')
      
      // Check for increased canvas resolution
      expect(reportContent).toMatch(/<canvas[^>]*id="historyChart"[^>]*width="1600"[^>]*height="600"/s)
      
      // Verify history chart rendering function exists
      expect(reportContent).toContain('drawHistoryChart')
      expect(reportContent).toContain('historyChart')

      done()
    })
  })

  it('should include "Go to Top" button for UI/UX', done => {
    exec(config_run_config('codecept.conf.js'), (err, stdout) => {
      debug(stdout)

      const reportFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output', 'report.html')
      const reportContent = fs.readFileSync(reportFile, 'utf8')
      
      // Check for scrollToTop function
      expect(reportContent).toContain('function scrollToTop()')
      expect(reportContent).toContain('window.scrollTo')
      expect(reportContent).toContain('behavior: \'smooth\'')
      
      // Check that button is created dynamically
      expect(reportContent).toContain('goTopBtn')
      expect(reportContent).toContain('↑ Top')
      expect(reportContent).toContain('position: \'fixed\'')
      expect(reportContent).toContain('bottom: \'30px\'')
      expect(reportContent).toContain('right: \'30px\'')

      done()
    })
  })

  it('should not show HTML Reporter debug logs in normal mode', done => {
    exec(config_run_config('codecept.conf.js', null, false), (err, stdout) => {
      debug(stdout)
      
      // HTML Reporter debug messages should NOT appear in normal output
      expect(stdout).not.toContain('HTML Reporter: Retry count detected')
      expect(stdout).not.toContain('HTML Reporter: Test finished')
      expect(stdout).not.toContain('HTML Reporter: Processing artifacts')
      expect(stdout).not.toContain('HTML Reporter: Found screenshot')
      expect(stdout).not.toContain('HTML Reporter: Checking directory')
      
      // But the report file should still be generated
      const reportFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output', 'report.html')
      expect(fs.existsSync(reportFile)).toBe(true)

      done()
    })
  })

  it('should show HTML Reporter debug logs in verbose/debug mode', done => {
    exec(config_run_config('codecept.conf.js', null, true), (err, stdout) => {
      debug(stdout)
      
      // HTML Reporter debug messages SHOULD appear in verbose output
      // Note: Some messages may only appear when certain conditions are met
      const hasDebugMessages = 
        stdout.includes('HTML Reporter') ||
        stdout.includes('<htmlReporter>') // plugin messages use this format
      
      expect(hasDebugMessages).toBe(true)

      done()
    })
  })

  it('should handle artifacts in worker mode', done => {
    exec(config_run_config('codecept.conf.js') + ' --workers 2', (err, stdout) => {
      debug(stdout)

      const reportFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output', 'report.html')
      const reportContent = fs.readFileSync(reportFile, 'utf8')
      
      // Check that artifacts section is present
      expect(reportContent).toContain('artifacts-section')
      
      // Should have screenshot handling code
      expect(reportContent).toContain('openImageModal')
      expect(reportContent).toContain('imageModal')

      done()
    })
  })

  it('should consolidate worker results correctly', done => {
    exec(config_run_config('codecept.conf.js') + ' --workers 2', (err, stdout) => {
      debug(stdout)

      const outputDir = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output')
      
      // Worker JSON files should be cleaned up after consolidation
      const files = fs.readdirSync(outputDir)
      const workerJsonFiles = files.filter(f => f.startsWith('worker-') && f.endsWith('-results.json'))
      expect(workerJsonFiles.length).toBe(0) // Should be deleted after consolidation
      
      // Final report should exist
      const reportFile = path.join(outputDir, 'report.html')
      expect(fs.existsSync(reportFile)).toBe(true)
      
      const reportContent = fs.readFileSync(reportFile, 'utf8')
      
      // All tests should be included
      expect(reportContent).toContain('test with multiple steps')
      expect(reportContent).toContain('test that will fail')
      expect(reportContent).toContain('test that will pass')

      done()
    })
  })

  it('should handle test retries and display retry information', done => {
    // This test assumes there's a config with retries enabled
    exec(config_run_config('codecept.conf.js', 'test that will fail'), (err, stdout) => {
      debug(stdout)

      const reportFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output', 'report.html')
      const reportContent = fs.readFileSync(reportFile, 'utf8')
      
      // Check for retry-related elements
      expect(reportContent).toContain('retry-section')
      expect(reportContent).toContain('retry-badge')
      expect(reportContent).toContain('retries')
      expect(reportContent).toContain('data-retries=')

      done()
    })
  })

  it('should apply filters correctly', done => {
    exec(config_run_config('codecept.conf.js'), (err, stdout) => {
      debug(stdout)

      const reportFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output', 'report.html')
      const reportContent = fs.readFileSync(reportFile, 'utf8')
      
      // Check for all filter types
      expect(reportContent).toContain('statusFilter')
      expect(reportContent).toContain('featureFilter')
      expect(reportContent).toContain('tagFilter')
      expect(reportContent).toContain('retryFilter')
      expect(reportContent).toContain('typeFilter')
      
      // Check filter functionality
      expect(reportContent).toContain('function applyFilters()')
      expect(reportContent).toContain('function resetFilters()')
      expect(reportContent).toContain('addEventListener(\'change\', applyFilters)')
      
      // Check data attributes needed for filtering
      expect(reportContent).toContain('data-status=')
      expect(reportContent).toContain('data-feature=')
      expect(reportContent).toContain('data-type=')

      done()
    })
  })

  it('should display system information when available', done => {
    exec(config_run_config('codecept.conf.js'), (err, stdout) => {
      debug(stdout)

      const reportFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output', 'report.html')
      const reportContent = fs.readFileSync(reportFile, 'utf8')
      
      // Check for system info section
      expect(reportContent).toContain('system-info-section')
      expect(reportContent).toContain('Environment Information')
      expect(reportContent).toContain('toggleSystemInfo')

      done()
    })
  })

  it('should handle edge cases: empty tests', done => {
    // Create a temporary empty test file
    const emptyTestFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'empty_test.js')
    fs.writeFileSync(emptyTestFile, 'Feature(\'Empty Feature\')\n\n// No scenarios\n')

    exec(config_run_config('codecept.conf.js', 'Empty Feature'), (err, stdout) => {
      debug(stdout)

      const reportFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output', 'report.html')
      
      // Report should still be generated even with no tests
      expect(fs.existsSync(reportFile)).toBe(true)
      
      const reportContent = fs.readFileSync(reportFile, 'utf8')
      expect(reportContent).toContain('CodeceptJS Test Report')
      
      // Cleanup
      fs.unlinkSync(emptyTestFile)

      done()
    })
  })

  it('should escape HTML in test names and error messages', done => {
    exec(config_run_config('codecept.conf.js'), (err, stdout) => {
      debug(stdout)

      const reportFile = path.join(`${codecept_dir}/configs/html-reporter-plugin`, 'output', 'report.html')
      const reportContent = fs.readFileSync(reportFile, 'utf8')
      
      // Check that escapeHtml function exists
      expect(reportContent).toContain('function escapeHtml(')
      expect(reportContent).toContain('.replace(/&/g, \'&amp;\')')
      expect(reportContent).toContain('.replace(/</g, \'&lt;\')')
      expect(reportContent).toContain('.replace(/>/g, \'&gt;\')')

      done()
    })
  })
})
