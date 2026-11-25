import * as chai from 'chai';
chai.should();
import { expect } from 'expect';
import { exec } from 'child_process';
import { codecept_dir, codecept_run } from './consts.js';
import debugFactory from 'debug';
const debug = debugFactory('codeceptjs:tests');
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  it('should print a step custom message above the error', done => {
    exec(config_run_config('codecept.conf.js', 'step custom message'), (err, stdout) => {
      debug(stdout)
      expect(err).toBeTruthy()
      expect(stdout).toContain('Checkout never loaded\n    element (#checkout) still not visible\n    waited 1 sec')
      done()
    })
  })

  it('should print a step custom message above an assertion error', done => {
    exec(config_run_config('codecept.conf.js', 'assertion custom message'), (err, stdout) => {
      debug(stdout)
      expect(err).toBeTruthy()
      expect(stdout).toContain('Order never reached paid\n  expected file')
      expect(stdout.match(/Order never reached paid/g)).toHaveLength(1)
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
