const expect = require('expect');
const exec = require('child_process').exec;
const { codecept_dir, codecept_run } = require('./consts');

const debug_this_test = false;

const config_run_config = (config, grep, verbose = false) => `${codecept_run} ${verbose || debug_this_test ? '--verbose' : ''} --config ${codecept_dir}/configs/timeouts/${config} ${grep ? `--grep "${grep}"` : ''}`;

describe('CodeceptJS Timeouts', function () {
  this.timeout(10000);

  it('should stop test when timeout exceeded', (done) => {
    exec(config_run_config('codecept.conf.js', 'timed out'), (err, stdout) => {
      debug_this_test && console.log(stdout);
      expect(stdout).toContain('Timeout 2s exceeded');
      expect(stdout).toContain('Timeout 1s exceeded');
      expect(err).toBeTruthy();
      done();
    });
  });

  it('should ignore timeouts if no timeout', (done) => {
    exec(config_run_config('codecept.conf.js', 'no timeout test'), (err, stdout) => {
      debug_this_test && console.log(stdout);
      expect(stdout).not.toContain('Timeout');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should use global timeouts if timeout is set', (done) => {
    exec(config_run_config('codecept.timeout.conf.js', 'no timeout test'), (err, stdout) => {
      debug_this_test && console.log(stdout);
      expect(stdout).toContain('Timeout 0.1');
      expect(err).toBeTruthy();
      done();
    });
  });

  it('should prefer step timeout', (done) => {
    exec(config_run_config('codecept.conf.js', 'timeout step', true), (err, stdout) => {
      debug_this_test && console.log(stdout);
      expect(stdout).toContain('was interrupted on step timeout 100ms');
      expect(err).toBeTruthy();
      done();
    });
  });

  it('should keep timeout with steps', (done) => {
    exec(config_run_config('codecept.timeout.conf.js', 'timeout step', true), (err, stdout) => {
      debug_this_test && console.log(stdout);
      expect(stdout).toContain('was interrupted on step timeout 100ms');
      expect(err).toBeTruthy();
      done();
    });
  });
});
