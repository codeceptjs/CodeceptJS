const path = require('path')
const { exec } = require('child_process')
const { expect } = require('expect')

const runner = path.join(__dirname, '../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '../acceptance')
const codecept_run = `${runner} run`
const config_run_config = (config, grep) =>
  `${codecept_run} --config ${codecept_dir}/${config} ${grep ? `--grep "${grep}"` : ''}`

describe('CodeceptJS plugin', function () {
  this.timeout(30000)

  before(() => {
    process.chdir(codecept_dir)
  })

  it('should retry the await/non await steps', (done) => {
    exec(`${config_run_config('codecept.Playwright.retryTo.js', '@plugin')} --verbose`, (err, stdout) => {
      const lines = stdout.split('\n')
      expect(lines).toEqual(expect.arrayContaining([expect.stringContaining('... Retrying')]))
      expect(err).toBeFalsy()
      done()
    })
  })

  it('should failed before the retryTo instruction', (done) => {
    exec(`${config_run_config('codecept.Playwright.retryTo.js', 'Should be succeed')} --verbose`, (err, stdout) => {
      expect(stdout).toContain('locator.waitFor: Timeout 1000ms exceeded.')
      expect(stdout).toContain('[1] Error | Error: element (.nothing) still not visible after 1 sec')
      expect(err).toBeTruthy()
      done()
    })
  })

  it('should generate the coverage report', (done) => {
    exec(`${config_run_config('codecept.Playwright.coverage.js', '@coverage')} --debug`, (err, stdout) => {
      const lines = stdout.split('\n')
      expect(lines).toEqual(
        expect.arrayContaining([
          expect.stringContaining('writing output/coverage'),
          expect.stringContaining('generated coverage reports:'),
          expect.stringContaining('output/coverage/index.html'),
        ]),
      )
      expect(err).toBeFalsy()
      done()
    })
  })

  it('should retry to failure', (done) => {
    exec(
      `${config_run_config('codecept.Playwright.retryTo.js', 'Should fail after reached max retries')} --verbose`,
      (err, stdout) => {
        const lines = stdout.split('\n')
        expect(lines).toEqual(expect.arrayContaining([expect.stringContaining('Custom pluginRetryTo Error')]))
        expect(err).toBeTruthy()
        done()
      },
    )
  })
})
