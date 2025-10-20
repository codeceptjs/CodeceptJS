import chai from 'chai'
chai.should()
import { expect } from 'expect'
import { exec } from 'child_process'
import path from 'path'
import { codecept_dir, codecept_run } from './consts.js'
import debugFactory from 'debug'
const debug = debugFactory('codeceptjs:tests')
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const config_run_config = (config, grep) => `${codecept_run} --steps --config ${codecept_dir}/configs/step-sections/${config} ${grep ? `--grep "${grep}"` : ''}`

describe('CodeceptJS step-sections', function () {
  this.timeout(10000)

  it('should run step-sections test', done => {
    exec(config_run_config('codecept.conf.js', 'basic step-sections'), (err, stdout) => {
      debug(stdout)
      expect(stdout).toContain('OK')
      expect(stdout).toContain('User Journey')
      expect(stdout).toContain('Nothing to say')

      // Check for the step structure (allowing for timing info in between)
      expect(stdout).toContain('I am in path "."')
      expect(stdout).toContain('User Journey')
      expect(stdout).toContain('I act "Hello, World!"')
      expect(stdout).toContain('I act "Nothing to say"')

      // Verify the indentation structure for sections
      expect(stdout).toMatch(/\s+User Journey/)
      expect(stdout).toMatch(/\s+I act "Hello, World!"/)

      expect(err).toBeFalsy()
      done()
    })
  })

  it('should run step-sections with page objects', done => {
    exec(config_run_config('codecept.conf.js', 'sections and page objects'), (err, stdout) => {
      debug(stdout)
      expect(stdout).toContain('OK')
      expect(stdout).toContain('User Journey')

      // Check for the step structure (allowing for timing info in between)
      expect(stdout).toContain('User Journey')
      expect(stdout).toContain('On userPage: act on page')
      expect(stdout).toContain('I act "actOnPage"')
      expect(stdout).toContain('I act "see on this page"')
      expect(stdout).toContain('I act "One more step"')
      expect(stdout).toContain('I act "Nothing to say"')

      // Verify the indentation structure for sections and nested steps
      expect(stdout).toMatch(/\s+User Journey/)
      expect(stdout).toMatch(/\s+On userPage: act on page/)
      expect(stdout).toMatch(/\s+I act "actOnPage"/)

      expect(err).toBeFalsy()
      done()
    })
  })

  it('should run hidden step-sections', done => {
    exec(config_run_config('codecept.conf.js', 'hidden step-sections'), (err, stdout) => {
      debug(stdout)
      expect(stdout).toContain('OK')

      expect(stdout).toContain('User Journey')
      expect(stdout).not.toContain('actOnPage')
      expect(stdout).not.toContain('One more step')
      expect(err).toBeFalsy()
      done()
    })
  })
})
