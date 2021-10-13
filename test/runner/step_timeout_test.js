const expect = require('expect');
const exec = require('child_process').exec;
const { codecept_dir, codecept_run } = require('./consts');

const config_run_config = (config, grep, verbose = false) => `${codecept_run} ${verbose ? '--verbose' : ''} --config ${codecept_dir}/configs/step_timeout/${config} ${grep ? `--grep "${grep}"` : ''}`;

describe('CodeceptJS Steps', function () {
  this.timeout(5000);

  it('should stop test, when step timeout exceeded', (done) => {
    exec(config_run_config('codecept-500.conf.js', 'Default command timeout'), (err, stdout) => {
      expect(stdout).toContain('Action exceededByTimeout: 1000 timed out after 500ms');
      expect(stdout).toContain('0 passed, 1 failed');
      expect(stdout).toContain('- I.exceededByTimeout(1000)');
      expect(err).toBeTruthy();
      done();
    });
  });

  it('should respect custom timeout with regex', (done) => {
    exec(config_run_config('codecept-500.conf.js', 'Wait with longer timeout'), (err, stdout) => {
      expect(stdout).not.toContain('timed out after');
      expect(stdout).toContain('1 passed');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should respect custom timeout with full step name', (done) => {
    exec(config_run_config('codecept-500.conf.js', 'Wait with shorter timeout'), (err, stdout) => {
      expect(stdout).toContain('Action waitTadShorter: 400 timed out after 300ms');
      expect(stdout).toContain('0 passed, 1 failed');
      expect(err).toBeTruthy();
      done();
    });
  });

  it('should not stop test, when step not exceeded', (done) => {
    exec(config_run_config('codecept-2000.conf.js', 'Default command timeout'), (err, stdout) => {
      expect(stdout).not.toContain('Step execution timeout of 2000 ms exceeded');
      expect(stdout).toContain('1 passed');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should ignore timeout for steps with `wait*` prefix', (done) => {
    exec(config_run_config('codecept-500.conf.js', 'Wait command timeout'), (err, stdout) => {
      expect(stdout).not.toContain('Step execution timeout of 500 ms exceeded');
      expect(stdout).toContain('1 passed');
      expect(err).toBeFalsy();
      done();
    });
  });

  it('step timeout should work nicely with step retries', (done) => {
    exec(config_run_config('codecept-500.conf.js', 'Rerun sleep', true), (err, stdout) => {
      console.log(stdout);
      expect(stdout).not.toContain('Step execution timeout of 500 ms exceeded');
      expect(stdout).toContain('1 passed');
      expect(stdout).toContain('Retrying... Attempt #2');
      expect(stdout).toContain('Retrying... Attempt #3');
      expect(err).toBeFalsy();
      done();
    });
  });
});
