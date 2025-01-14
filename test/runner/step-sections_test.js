const { expect } = require('expect')
const exec = require('child_process').exec
const { codecept_dir, codecept_run } = require('./consts')
const debug = require('debug')('codeceptjs:tests')

const config_run_config = (config, grep) => `${codecept_run} --steps --config ${codecept_dir}/configs/step-sections/${config} ${grep ? `--grep "${grep}"` : ''}`

describe('CodeceptJS step-sections', function () {
  this.timeout(10000)

  it('should run step-sections test', done => {
    exec(config_run_config('codecept.conf.js', 'basic step-sections'), (err, stdout) => {
      debug(stdout)
      expect(stdout).toContain('OK')
      expect(stdout).toContain('User Journey')
      expect(stdout).toContain('Nothing to say')

      const expectedOutput = ['    I am in path "."', '    User Journey', '      I act "Hello, World!"', '    I act "Nothing to say"'].join('\n')

      expect(stdout).toContain(expectedOutput)
      expect(err).toBeFalsy()
      done()
    })
  })

  it('should run step-sections with page objects', done => {
    exec(config_run_config('codecept.conf.js', 'sections and page objects'), (err, stdout) => {
      debug(stdout)
      expect(stdout).toContain('OK')
      expect(stdout).toContain('User Journey')

      const expectedOutput = ['    User Journey', '      On userPage: act on page', '        I act "actOnPage"', '        I act "see on this page"', '      I act "One more step"', '    I act "Nothing to say"'].join('\n')

      expect(stdout).toContain(expectedOutput)
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
