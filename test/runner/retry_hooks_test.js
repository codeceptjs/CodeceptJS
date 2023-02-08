const expect = require('expect');
const exec = require('child_process').exec;
const { codecept_dir, codecept_run } = require('./consts');

const debug_this_test = true;

const config_run_config = (config, grep, verbose = false) => `${codecept_run} ${verbose || debug_this_test ? '--verbose' : ''} --config ${codecept_dir}/configs/retryHooks/${config} ${grep ? `--grep "${grep}"` : ''}`;

describe('CodeceptJS Retry Hooks', function () {
  this.timeout(5000);

  it('run config ', (done) => {
    exec(config_run_config('codecept.conf.js'), (err, stdout) => {
      debug_this_test && console.log(stdout);
      done();
    });
  });
});
