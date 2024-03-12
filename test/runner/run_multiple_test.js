import assert from 'assert';
import { expect } from 'chai';
import path, { dirname } from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const runner = path.join(__dirname, '../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '../../test/data/sandbox');
const codecept_run = `${runner} run-multiple --config ${codecept_dir}/codecept.multiple.js `;

describe('CodeceptJS Multiple Runner', function () {
  this.timeout(40000);

  before(() => {
    global.codecept_dir = codecept_dir;
    process.chdir(codecept_dir);
  });

  it('should execute one suite with browser', (done) => {
    exec(`${codecept_run}default:firefox`, (err, stdout) => {
      console.log(stdout)
      expect(stdout).to.include('CodeceptJS'); // feature
      expect(stdout).to.include('.default:firefox]');
      expect(stdout).to.not.include('.default:chrome]');
      assert(!err);
      done();
    });
  });

  it('should execute all suites', (done) => {
    exec(`${codecept_run}--all`, (err, stdout) => {
      expect(stdout).to.include('CodeceptJS'); // feature
      expect(stdout).to.include('[1.default:chrome]');
      expect(stdout).to.include('[2.default:firefox]');
      expect(stdout).to.include('[3.mobile:android]');
      expect(stdout).to.include('[4.mobile:safari]');
      expect(stdout).to.include('[5.mobile:chrome]');
      expect(stdout).to.include('[6.mobile:safari]');
      expect(stdout).to.include('[7.grep:chrome]');
      expect(stdout).to.include('[8.grep:firefox]');
      expect(stdout).to.include('[7.grep:chrome]');
      expect(stdout).to.include('[1.default:chrome]');
      expect(stdout).to.include('[3.mobile:android]');
      assert(!err);
      done();
    });
  });

  it('should replace parameters', (done) => {
    exec(`${codecept_run}grep --debug`, (err, stdout) => {
      expect(stdout).to.include('CodeceptJS'); // feature
      expect(stdout).to.include('[1.grep:chrome]');
      expect(stdout).to.include('[2.grep:firefox]');
      assert(!err);
      done();
    });
  });

  it('should execute multiple suites', (done) => {
    exec(`${codecept_run}mobile default `, (err, stdout) => {
      expect(stdout).to.include('CodeceptJS'); // feature
      expect(stdout).to.include('[1.mobile:android]');
      expect(stdout).to.include('[2.mobile:safari]');
      expect(stdout).to.include('[3.mobile:chrome]');
      expect(stdout).to.include('[4.mobile:safari]');
      expect(stdout).to.include('[5.default:chrome]');
      expect(stdout).to.include('[6.default:firefox]');
      assert(!err);
      done();
    });
  });

  it('should execute multiple suites with selected browsers', (done) => {
    exec(`${codecept_run}mobile:safari default:chrome `, (err, stdout) => {
      expect(stdout).to.include('CodeceptJS'); // feature
      expect(stdout).to.include('[1.mobile:safari]');
      expect(stdout).to.include('[2.mobile:safari]');
      expect(stdout).to.include('[3.default:chrome]');
      assert(!err);
      done();
    });
  });

  it('should print steps', (done) => {
    exec(`${codecept_run}default --steps`, (err, stdout) => {
      expect(stdout).to.include('CodeceptJS'); // feature
      expect(stdout).to.include('[2.default:firefox]  ');
      expect(stdout).to.include('[2.default:firefox]     I');
      expect(stdout).to.include('[1.default:chrome]  ');
      expect(stdout).to.include('[1.default:chrome]     I');
      assert(!err);
      done();
    });
  });

  it('should pass grep to configuration', (done) => {
    exec(`${codecept_run}default --grep @grep`, (err, stdout) => {
      expect(stdout).to.include('CodeceptJS'); // feature
      expect(stdout).to.include('[1.default:chrome]');
      expect(stdout).to.include('[2.default:firefox]');
      expect(stdout).to.not.include('[1.default:chrome]');
      expect(stdout).to.not.include('[2.default:firefox]');
      assert(!err);
      done();
    });
  });

  it('should pass grep invert to configuration', (done) => {
    exec(`${codecept_run}default --grep @grep --invert`, (err, stdout) => {
      expect(stdout).to.include('CodeceptJS'); // feature
      expect(stdout).to.not.include('[1.default:chrome]');
      expect(stdout).to.not.include('[2.default:firefox]');
      expect(stdout).to.include('[1.default:chrome]');
      expect(stdout).to.include('[2.default:firefox]');
      assert(!err);
      done();
    });
  });

  it('should pass tests to configuration', (done) => {
    exec(`${codecept_run}test`, (err, stdout) => {
      expect(stdout).to.include('CodeceptJS'); // feature
      expect(stdout).to.include('[1.test:chrome]size');
      expect(stdout).to.include('[2.test:firefox]size');
      expect(stdout).to.include('[1.test:chrome]');
      expect(stdout).to.include('[2.test:firefox]');
      assert(!err);
      done();
    });
  });

  it('should run chunks', (done) => {
    exec(`${codecept_run}chunks`, (err, stdout) => {
      expect(stdout).to.include('CodeceptJS'); // feature
      expect(stdout).to.include('[1.chunks:chunk1:dummy] print browser');
      expect(stdout).to.include('[2.chunks:chunk2:dummy]');
      assert(!err);
      done();
    });
  });

  it('should run features in parallel', (done) => {
    process.chdir(codecept_dir);
    exec(`${runner} run-multiple --config codecept.multiple.features.js chunks --features  --grep '(?=.*)^(?!.*@fail)'`, (err, stdout) => {
      expect(stdout).to.include('[1.chunks:chunk1:default] Checkout examples process');
      expect(stdout).to.not.include('[2.chunks:chunk2:default] Checkout examples process');
      expect(stdout).to.include('[2.chunks:chunk2:default] Checkout string');
      expect(stdout).to.not.include('[1.chunks:chunk1:default] Checkout string');
      expect(stdout).to.include('[1.chunks:chunk1:default]   OK  |');
      expect(stdout).to.include('[2.chunks:chunk2:default]   OK  |');
      expect(stdout).to.not.include('@feature_grep');
      assert(!err);
      done();
    });
  });

  it('should run features & tests in parallel', (done) => {
    process.chdir(codecept_dir);
    exec(`${runner} run-multiple --config codecept.multiple.features.js chunks --grep '(?=.*)^(?!.*@fail)'`, (err, stdout) => {
      expect(stdout).to.include('@feature_grep');
      expect(stdout).to.include('Checkout examples process');
      expect(stdout).to.include('Checkout string');
      assert(!err);
      done();
    });
  });

  it('should run only tests in parallel', (done) => {
    process.chdir(codecept_dir);
    exec(`${runner} run-multiple --config codecept.multiple.features.js chunks --tests`, (err, stdout) => {
      expect(stdout).to.include('@feature_grep');
      expect(stdout).to.not.include('Checkout examples process');
      expect(stdout).to.not.include('Checkout string');
      assert(!err);
      done();
    });
  });

  it('should exit with non-zero code for failures during init process', (done) => {
    process.chdir(codecept_dir);
    exec(`${runner} run-multiple --config codecept.multiple.initFailure.js default --all`, (err, stdout) => {
      expect(err).not.to.false;
      expect(err.code).toBe(1);
      expect(stdout).contain('Failed on FailureHelper');
      done();
    });
  });

  it('should exit code 1 when error in config', (done) => {
    process.chdir(codecept_dir);
    exec(`${runner} run-multiple --config configs/codecept-invalid.config.js default --all`, (err, stdout, stderr) => {
      expect(stdout).not.contain('UnhandledPromiseRejectionWarning');
      expect(stderr).not.contain('UnhandledPromiseRejectionWarning');
      expect(stdout).contain('badFn is not defined');
      expect(err).not.null;
      done();
    });
  });

  describe('bootstrapAll and teardownAll', () => {
    const _codecept_run = `run-multiple --config ${codecept_dir}`;
    it('should be executed from async function in config', (done) => {
      exec(`${runner} ${_codecept_run}/codecept.async.bootstrapall.multiple.code.js default`, (err, stdout) => {
        expect(stdout).to.include('CodeceptJS'); // feature
        expect(stdout).to.include('Results: inside Promise\n"event.multiple.before" is called');
        expect(stdout).to.include('"teardownAll" is called.');
        assert(!err);
        done();
      });
    });

    it('should be executed from function in config', (done) => {
      exec(`${runner} ${_codecept_run}/codecept.bootstrapall.multiple.code.js default`, (err, stdout) => {
        expect(stdout).to.include('CodeceptJS'); // feature
        expect(stdout).to.include('"bootstrapAll" is called.');
        expect(stdout).to.include('"teardownAll" is called.');
        assert(!err);
        done();
      });
    });
  });

  describe('with require parameter', () => {
    const _codecept_run = `run-multiple --config ${codecept_dir}`;
    const moduleOutput = 'Module was required 1';
    const moduleOutput2 = 'Module was required 2';

    it('should be executed with module when described', (done) => {
      process.chdir(codecept_dir);
      exec(`${runner} ${_codecept_run}/codecept.require.multiple.single.json default`, (err, stdout) => {
        expect(stdout).to.include(moduleOutput);
        expect(stdout).to.not.include(moduleOutput2);
        expect(stdout.match(new RegExp(moduleOutput, 'g')) || []).to.have.lengthOf(2);
        assert(!err);
        done();
      });
    });

    it('should be executed with several module when described', (done) => {
      process.chdir(codecept_dir);
      exec(`${runner} ${_codecept_run}/codecept.require.multiple.several.js default`, (err, stdout) => {
        expect(stdout).to.include(moduleOutput);
        expect(stdout).to.include(moduleOutput2);
        expect(stdout.match(new RegExp(moduleOutput, 'g')) || []).to.have.lengthOf(2);
        expect(stdout.match(new RegExp(moduleOutput2, 'g')) || []).to.have.have.lengthOf(2);
        assert(!err);
        done();
      });
    });

    it('should not be executed without module when not described', (done) => {
      process.chdir(codecept_dir);
      exec(`${runner} ${_codecept_run}/codecept.require.multiple.without.json default`, (err, stdout) => {
        expect(stdout).to.not.include(moduleOutput);
        expect(stdout).to.not.include(moduleOutput2);
        assert(!err);
        done();
      });
    });
  });
});
