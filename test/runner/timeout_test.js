const { expect } = require('expect');
const exec = require('child_process').exec;
const { codecept_dir, codecept_run } = require('./consts');

const debug_this_test = false;

const config_run_config = (config, grep, verbose = false) => `${codecept_run} ${verbose || debug_this_test ? '--verbose' : ''} --config ${codecept_dir}/configs/timeouts/${config} ${grep ? `--grep "${grep}"` : ''}`;

describe('CodeceptJS Timeouts', function () {
  this.timeout(10000);

  it('should stop test when timeout exceeded', () => {
    exec(config_run_config('codecept.conf.js', 'timed out'), (err, stdout) => {
      console.log(stdout);
      expect(stdout).toContain('Timeout 2s exceeded');
      expect(stdout).toContain('Timeout 1s exceeded');
      expect(err).toBeTruthy();
    });
  });

  it('should take --no-timeouts option', () => {
    exec(`${config_run_config('codecept.conf.js', 'timed out')} --no-timeouts`, (err, stdout) => {
      debug_this_test && console.log(stdout);
      expect(stdout).toContain('Timeouts were disabled');
      expect(stdout).not.toContain('Timeout 2s exceeded');
      expect(stdout).not.toContain('Timeout 1s exceeded');
      expect(err).toBeFalsy();
    });
  });

  it('should ignore timeouts if no timeout', () => {
    exec(config_run_config('codecept.conf.js', 'no timeout test'), (err, stdout) => {
      debug_this_test && console.log(stdout);
      expect(stdout).not.toContain('Timeout');
      expect(err).toBeFalsy();
    });
  });

  it('should use global timeouts if timeout is set', () => {
    exec(config_run_config('codecept.timeout.conf.js', 'no timeout test'), (err, stdout) => {
      debug_this_test && console.log(stdout);
      expect(stdout).toContain('Timeout 0.1');
      expect(err).toBeTruthy();
    });
  });

  it('should prefer step timeout', () => {
    exec(config_run_config('codecept.conf.js', 'timeout step', true), (err, stdout) => {
      debug_this_test && console.log(stdout);
      expect(stdout).toContain('was interrupted on step timeout 100ms');
      expect(err).toBeTruthy();
    });
  });

  it('should keep timeout with steps', () => {
    exec(config_run_config('codecept.timeout.conf.js', 'timeout step', true), (err, stdout) => {
      debug_this_test && console.log(stdout);
      expect(stdout).toContain('was interrupted on step timeout 100ms');
      expect(err).toBeTruthy();
    });
  });

  it('should override timeout config from global object', () => {
    exec(config_run_config('codecept.timeout.obj.conf.js', '#first', false), (err, stdout) => {
      debug_this_test && console.log(stdout);
      expect(stdout).toContain('Timeout 0.3s exceeded');
      expect(err).toBeTruthy();
    });
  });

  it('should override timeout config from global object but respect local value', () => {
    exec(config_run_config('codecept.timeout.obj.conf.js', '#second'), (err, stdout) => {
      debug_this_test && console.log(stdout);
      expect(stdout).not.toContain('Timeout 0.3s exceeded');
      expect(stdout).toContain('Timeout 0.5s exceeded');
      expect(err).toBeTruthy();
    });
  });

  it('should respect grep when overriding config from global config', () => {
    exec(config_run_config('codecept.timeout.obj.conf.js', '#fourth'), (err, stdout) => {
      debug_this_test && console.log(stdout);
      expect(stdout).not.toContain('Timeout 0.3s exceeded');
      expect(stdout).toContain('Timeout 1s exceeded');
      expect(err).toBeTruthy();
    });
  });
});
