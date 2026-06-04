import * as chai from 'chai';
chai.should();
import { expect } from 'expect';
import { describe, it, before } from 'mocha';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import util from 'util'; // Import Node's utility module

const execAsync = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runner = path.resolve(__dirname, '../../bin/codecept.js')
const codecept_dir = path.resolve(__dirname, '../data/sandbox/configs/run-rerun')
const codecept_run = `node ${runner} run-rerun`
const codecept_run_config = (config, grep) => `${codecept_run} -c ${codecept_dir}/${config} --grep "${grep || ''}"`

/**
 * A helper to gracefully handle CLI execution without throwing exceptions on exit code 1.
 * This makes testing expected failures much easier.
 */
async function safeExec(command, options = {}) {
  try {
    const { stdout, stderr } = await execAsync(command, options);
    return { err: null, stdout, stderr };
  } catch (error) {
    // execAsync throws on non-zero exit codes. We catch it and return it for testing.
    return { err: error, stdout: error.stdout, stderr: error.stderr };
  }
}

describe('run-rerun command', function () {
  this.timeout(30000); // 30 seconds for CLI tests

  before(() => {
    process.chdir(codecept_dir);
  });

  it('should display count of attempts', async () => {
    const { err, stdout } = await safeExec(`${codecept_run_config('codecept.conf.js')} --verbose`);

    // DEBUG: If the split fails, print the whole output to the console
    if (!stdout.includes('Run Rerun - Command --')) {
      console.error('DEBUG - Stdout did not contain expected split string:', stdout);
    }

    expect(stdout).toContain('1 passed');

    expect(stdout).toContain('Process run 1 of max 3, success runs 1/3');
    expect(stdout).toContain('Process run 2 of max 3, success runs 2/3');
    expect(stdout).toContain('Process run 3 of max 3, success runs 3/3');
    expect(stdout).toContain('1 passed');
    expect(err).toBeNull();
  });

  it('should display 2 success count of attemps', async () => {
    const { err, stdout } = await safeExec(`${codecept_run_config('codecept.conf.min_less_max.js')} --debug`);

    expect(stdout).toContain('1 passed');

    expect(stdout).toContain('Process run 1 of max 3, success runs 1/2');
    expect(stdout).toContain('Process run 2 of max 3, success runs 2/2');
    expect(stdout).not.toContain('Process run 3 of max 3');
    expect(stdout).toContain('1 passed');
    expect(err).toBeNull();
  });

  it('should display error if minSuccess more than maxReruns', async () => {
    const { err, stdout } = await safeExec(`${codecept_run_config('codecept.conf.min_more_max.js')} --debug`);

    expect(stdout).toContain('minSuccess must be less than maxReruns');
    expect(err.code).toBe(1); // 👈 We can test the error code easily
  });

  it('should display errors if test is fail always', async () => {
    const { err, stdout } = await safeExec(`${codecept_run_config('codecept.conf.fail_test.js', '@RunRerun - Fail all attempt')} --debug`);

    expect(stdout).toContain('Fail run 1 of max 3, success runs 0/2');
    expect(stdout).toContain('Process run 3 of max 3, success runs 2/2');
    expect(err.code).toBe(1);
  });

  it('should display success run if test was fail one time of two attempts and 3 reruns', async () => {
    const { err, stdout } = await safeExec(
      `${codecept_run_config('codecept.conf.fail_test.js', '@RunRerun - fail second test')} --debug`,
      { env: { ...process.env, FAIL_ATTEMPT: '0' } }
    );

    expect(stdout).toContain('Process run 1 of max 3, success runs 1/2');
    expect(stdout).toContain('Process run 2 of max 3, success runs 2/2');
    expect(err).toBeNull();
  });

  it('should throw exit code 1 if all tests were supposed to pass', async () => {
    const { err, stdout } = await safeExec(
      `${codecept_run_config('codecept.conf.pass_all_test.js', '@RunRerun - fail second test')} --debug`,
      { env: { ...process.env, FAIL_ATTEMPT: '0' } }
    );

    expect(stdout).toContain('Process run 1 of max 3, success runs 1/3');
    expect(stdout).toContain('Process run 3 of max 3, success runs 3/3');
  });
});
