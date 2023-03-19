const expect = require('expect');
const exec = require('child_process').exec;
const { codecept_dir, codecept_run } = require('./consts');

const debug_this_test = false;

const config_run_config = (config, grep, verbose = false) => `${codecept_run} ${verbose || debug_this_test ? '--verbose' : ''} --config ${codecept_dir}/configs/retryHooks/${config} ${grep ? `--grep "${grep}"` : ''}`;

describe('CodeceptJS Retry Hooks', function () {
  this.timeout(10000);

  ['#Async ', '#Before ', '#BeforeSuite ', '#Helper '].forEach(retryHook => {
    it(`run ${retryHook} config`, (done) => {
      exec(config_run_config('codecept.conf.js', retryHook), (err, stdout) => {
        debug_this_test && console.log(stdout);
        expect(stdout).toContain('OK  | 1 passed');
        done();
      });
    });
  });

  ['#Before ', '#BeforeSuite '].forEach(retryHook => {
    it(`should ${retryHook} set hook retries from global config`, (done) => {
      exec(config_run_config('codecept.retry.obj.conf.js', retryHook), (err, stdout) => {
        debug_this_test && console.log(stdout);
        expect(stdout).toContain('OK  | 1 passed');
        done();
      });
    });
  });

  it('should finish if retry has not happened', (done) => {
    exec(config_run_config('codecept.conf.js', '#FailBefore '), (err, stdout) => {
      debug_this_test && console.log(stdout);
      expect(stdout).toContain('-- FAILURES');
      expect(stdout).toContain('not works');
      expect(stdout).toContain('1) Fail #FailBefore hook');
      done();
    });
  });
});
