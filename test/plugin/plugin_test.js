import path from 'path'
import { exec } from 'child_process'
import { expect } from 'expect'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const runner = path.join(__dirname, '../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '../acceptance')
const codecept_run = `${runner} run`
const config_run_config = (config, grep) => `${codecept_run} --config ${codecept_dir}/${config} ${grep ? `--grep "${grep}"` : ''}`

describe('CodeceptJS plugin', function () {
  this.timeout(60000)

  before(() => {
    process.chdir(codecept_dir)
  })

  it('should initialize the coverage plugin and attempt coverage collection', done => {
    const timeout = setTimeout(() => {
      done(new Error('Test timed out after 50 seconds'))
    }, 50000)

    exec(`${config_run_config('codecept.Playwright.coverage.js', '@coverage')} --debug`, { timeout: 45000 }, (err, stdout, stderr) => {
      clearTimeout(timeout)

      const output = stdout + stderr
      const lines = output.split('\n')

      try {
        // Check that the coverage plugin is loaded and starts attempting coverage collection
        expect(lines).toEqual(expect.arrayContaining([expect.stringContaining('Plugins: screenshotOnFail, coverage'), expect.stringContaining('writing output/coverage')]))

        // Test should pass regardless of whether coverage data is found (depends on external site)
        // The test may fail due to network issues or browser problems, but the coverage plugin should still initialize
        done()
      } catch (error) {
        console.log('Test output:', output)
        done(error)
      }
    })
  })
})
