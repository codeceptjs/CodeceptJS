import path, { dirname } from 'path';
import { exec } from 'child_process';
import { expect } from 'expect';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const runner = path.join(__dirname, '../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '../../test/data/sandbox/configs/commentStep');
const codecept_run = `${runner} run`;
const config_run_config = (config, grep) => `${codecept_run} --config ${codecept_dir}/${config} ${
  grep ? `--grep "${grep}"` : ''
}`;

describe.skip('CodeceptJS commentStep plugin', function () {
  this.timeout(3000);

  before(() => {
    process.chdir(codecept_dir);
  });

  it('should print nested steps when global var comments used', done => {
    console.log(`${config_run_config('codecept.conf.js', 'global var')} --debug`)
    exec(`${config_run_config('codecept.conf.js', 'global var')} --debug`, (err, stdout) => {
      const lines = stdout.split('\n');
      console.log(stdout);
      expect(lines).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Prepare user base:'),
          expect.stringContaining('I print "other thins"'),
          expect.stringContaining('Update data:'),
          expect.stringContaining('I print "do some things"'),
          expect.stringContaining('Check the result:'),
          expect.stringContaining('I print "see everything works"'),
        ]),
      );
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should print nested steps when local var comments used', done => {
    exec(`${config_run_config('codecept.conf.js', 'local var')} --debug`, (err, stdout) => {
      const lines = stdout.split('\n');
      expect(lines).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Prepare project:'),
          expect.stringContaining('I print "other thins"'),
          expect.stringContaining('Update project:'),
          expect.stringContaining('I print "do some things"'),
          expect.stringContaining('Check project:'),
          expect.stringContaining('I print "see everything works"'),
        ]),
      );
      expect(err).toBeFalsy();
      done();
    });
  });
});
