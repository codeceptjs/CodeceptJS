import { expect  } from 'expect'
import chai from 'chai'
import { exec } from 'child_process'
import { codecept_dir, codecept_run  } from './consts.js'
import debug from 'debug'
const { expect: chaiExpect } = chai

const config_run_config = (config, grep, verbose = false) => `${codecept_run} ${verbose ? '--verbose' : ''} --config ${codecept_dir}/configs/store-test-and-suite/${config} ${grep ? `--grep "${grep}"` : ''}`

describe('CodeceptJS store-test-and-suite', function () {
  this.timeout(10000)

  it('should run store-test-and-suite test', done => {
    exec(config_run_config('codecept.conf.js'), (err, stdout) => {
      debug(stdout)
      expect(stdout).toContain('test store-test-and-suite test')
      expect(stdout).toContain('OK')
      expect(err).toBeFalsy()
      done()
    })
  })
})
