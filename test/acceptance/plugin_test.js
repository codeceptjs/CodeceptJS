const path = require('path');
const { exec } = require('child_process');
const { expect } = require('expect');

const runner = path.join(__dirname, '../../bin/codecept.js');
const codecept_dir = path.join(
  __dirname,
  '',
);
const codecept_run = `${runner} run`;
const config_run_config = (config, grep) => `${codecept_run} --config ${codecept_dir}/${config} ${
  grep ? `--grep "${grep}"` : ''
}`;

describe('CodeceptJS plugin', function () {
  this.timeout(30000);

  before(() => {
    process.chdir(codecept_dir);
  });

  it('should retry the await/non await steps', (done) => {
    exec(`${config_run_config('codecept.Playwright.retryTo.js', '@plugin')} --verbose`, (err, stdout) => {
      const lines = stdout.split('\n');
      expect(lines).toEqual(
        expect.arrayContaining([
          expect.stringContaining('... Retrying'),
        ]),
      );
      expect(err).toBeFalsy();
      done();
    });
  });
});
