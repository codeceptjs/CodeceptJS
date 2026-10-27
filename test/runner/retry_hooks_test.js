import * as chai from 'chai';
chai.should();
import { expect } from 'expect';
import { exec } from 'child_process';
import { codecept_dir, codecept_run } from './consts.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const debug_this_test = false

const config_run_config = (config, grep, verbose = false) => `${codecept_run} ${verbose || debug_this_test ? '--verbose' : ''} --config ${codecept_dir}/configs/retryHooks/${config} ${grep ? `--grep "${grep}"` : ''}`

describe('CodeceptJS Retry Hooks', function () {
  this.timeout(10000)
  ;['#Async ', '#Before ', '#BeforeSuite ', '#Helper '].forEach(retryHook => {
    it(`run ${retryHook} config`, done => {
      exec(config_run_config('codecept.conf.js', retryHook), (err, stdout) => {
        debug_this_test && console.log(stdout)
        expect(stdout).toContain('1 passed')
        done()
      })
    })
  })

  it('run should load hook config from Before().retry()', done => {
    exec(config_run_config('codecept.retry.hookconfig.conf.js', '#Async '), (err, stdout) => {
      debug_this_test && console.log(stdout)
      expect(stdout).toContain('1 passed')
      done()
    })
  })
  ;['#Before ', '#BeforeSuite '].forEach(retryHook => {
    it(`should ${retryHook} set hook retries from global config`, done => {
      exec(config_run_config('codecept.retry.obj.conf.js', retryHook), (err, stdout) => {
        debug_this_test && console.log(stdout)
        expect(stdout).toContain('1 passed')
        done()
      })
    })
  })

  it('should finish if retry has not happened', done => {
    exec(config_run_config('codecept.conf.js', '#FailBefore '), (err, stdout) => {
      debug_this_test && console.log(stdout)
      expect(stdout).toContain('-- FAILURES')
      expect(stdout).toContain('not works')
      expect(stdout).toContain('1) Fail #FailBefore hook')
      done()
    })
  })

  it('should set global retry', done => {
    exec(config_run_config('codecept.retry.global.conf.js', '#globalRetry'), (err, stdout) => {
      debug_this_test && console.log(stdout)
      expect(stdout).toContain('1 passed')
      done()
    })
  })

  it('should set global scenario retry', done => {
    exec(config_run_config('codecept.retry.global.scenario.conf.js', '#globalScenarioRetry'), (err, stdout) => {
      debug_this_test && console.log(stdout)
      expect(stdout).toContain('1 passed')
      done()
    })
  })

  it('should prevent retry config accumulation across tests', done => {
    exec(config_run_config('codecept.retry.accumulation.conf.js', ''), (err, stdout) => {
      debug_this_test && console.log(stdout)
      expect(stdout).toContain('2 passed')
      done()
    })
  })

  it('should retryFailedStep on multiple consequent scenarios', done => {
    exec(config_run_config('codecept.retry.multipleScenarios.conf.js', ''), (err, stdout) => {
      debug_this_test && console.log(stdout)
      expect(stdout).toContain('3 passed')
      done()
    })
  })
})
