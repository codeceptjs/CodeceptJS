const { expect } = require('expect')
const exec = require('child_process').exec
const { codecept_dir, codecept_run } = require('./consts')
const debug = require('debug')('codeceptjs:tests')
const fs = require('fs')
const path = require('path')

const config_run_config = (config, grep, verbose = false) => `${codecept_run} ${verbose ? '--verbose' : ''} --config ${codecept_dir}/configs/custom-reporter-plugin/${config} ${grep ? `--grep "${grep}"` : ''}`

describe('CodeceptJS custom-reporter-plugin', function () {
  this.timeout(10000)

  it('should run custom-reporter-plugin test', done => {
    exec(config_run_config('codecept.conf.js'), (err, stdout) => {
      debug(stdout)

      // Check for custom reporter output messages
      expect(stdout).toContain('Hook Finished:')
      expect(stdout).toContain('Test Started:')
      expect(stdout).toContain('Test Failed:')
      expect(stdout).toContain('Test Finished:')
      expect(stdout).toContain('All tests completed')
      expect(stdout).toContain('Total:')
      expect(stdout).toContain('Passed:')

      // Check if result file exists and has content
      const resultFile = path.join(`${codecept_dir}/configs/custom-reporter-plugin`, 'output', 'result.json')
      expect(fs.existsSync(resultFile)).toBe(true)

      const resultContent = JSON.parse(fs.readFileSync(resultFile, 'utf8'))
      expect(resultContent).toBeTruthy()
      expect(resultContent).toHaveProperty('stats')
      expect(resultContent.stats).toHaveProperty('tests')
      expect(resultContent.stats).toHaveProperty('passes')
      expect(resultContent.stats).toHaveProperty('failures')

      expect(err).toBeTruthy()
      done()
    })
  })
})
