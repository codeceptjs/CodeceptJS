import { expect  } from 'expect'
import chai from 'chai'
import { exec } from 'child_process'
import { codecept_dir, codecept_run  } from './consts.js'
import debug from 'debug'

const { expect: chaiExpect } = chai

const config_run_config = (config, grep, verbose = false) => `${codecept_run} ${verbose ? '--verbose' : ''} --config ${codecept_dir}/configs/step-enhancements/${config} ${grep ? `--grep "${grep}"` : ''}`

describe('CodeceptJS step-enhancements', function () {
  this.timeout(10000)

  it('should apply step options', done => {
    exec(config_run_config('codecept.conf.js', 'opts', true), (err, stdout) => {
      debug(stdout)
      expect(stdout).toContain('Option: Hello')
      expect(stdout).toContain('options applied {"text":"Hello"}')
      expect(stdout).toContain('print option')
      expect(stdout).not.toContain('print option {"text":"Hello"}')
      expect(stdout).toContain('OK')
      expect(err).toBeFalsy()
      done()
    })
  })

  it('should apply step timeouts', done => {
    exec(config_run_config('codecept.conf.js', 'timeouts', true), (err, stdout) => {
      debug(stdout)
      expect(err).toBeTruthy()
      expect(stdout).not.toContain('OK')
      expect(stdout).toContain('was interrupted on timeout 100ms')
      done()
    })
  })

  it('should apply step retry', done => {
    exec(config_run_config('codecept.conf.js', 'retry', true), (err, stdout) => {
      debug(stdout)
      expect(stdout).toContain('OK')
      expect(err).toBeFalsy()
      done()
    })
  })
})
