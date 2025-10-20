const { expect } = require('expect')
const path = require('path')
const { exec } = require('child_process')

const runner = path.join(__dirname, '/../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/sandbox')
const codecept_run = `${runner} run`
const config_run_config = config => `${codecept_run} --config ${codecept_dir}/${config}`

describe('Scenario termination check', () => {
  before(() => {
    process.chdir(codecept_dir)
  })

  it('Should always fail and terminate', done => {
    exec(config_run_config('codecept.scenario-stale.js'), (err, stdout) => {
      expect(stdout).toContain('should not stale scenario error') // feature
      expect(err).toBeTruthy()
      done()
    })
  })
})
