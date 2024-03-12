import { expect } from 'chai';
import assert from 'assert';
import path, { dirname } from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import * as event from '../../lib/event.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const runner = path.join(__dirname, '../../bin/codecept.js');
const codecept_dir = path.join(__dirname, '../../test/data/sandbox');
const codecept_run = `${runner} run`;
const codecept_run_config = config => `${codecept_run} --config ${codecept_dir}/${config}`;

describe('CodeceptJS Runner', () => {
  before(() => {
    global.codecept_dir = codecept_dir;
    process.chdir(codecept_dir);
  });

  it('should be executed in current dir', (done) => {
    exec(codecept_run, (err, stdout) => {
      expect(stdout).to.include('Filesystem'); // feature
      expect(stdout).to.include('check current dir'); // test name
      assert(!err);
      done();
    });
  });

  it('should be executed with glob', (done) => {
    exec(codecept_run_config('codecept.glob.js'), (err, stdout) => {
      expect(stdout).to.include('Filesystem'); // feature
      expect(stdout).to.include('glob current dir'); // test name
      assert(!err);
      done();
    });
  });

  it('should be executed with config path', (done) => {
    exec(`${codecept_run} -c ${codecept_dir}`, (err, stdout) => {
      expect(stdout).to.include('Filesystem'); // feature
      expect(stdout).to.include('check current dir'); // test name
      assert(!err);
      done();
    });
  });

  it('should show failures and exit with 1 on fail', (done) => {
    exec(codecept_run_config('codecept.failed.js'), (err, stdout) => {
      expect(stdout).to.include('Not-A-Filesystem');
      expect(stdout).to.include('file is not in dir');
      expect(stdout).to.include('FAILURES');
      expect(err.code).to.eql(1);
      done();
    });

    it('should except a directory glob pattern', (done) => {
      exec(`${codecept_run} "test-dir/*"`, (err, stdout) => {
        expect(stdout).to.include('2 passed'); // number of tests present in directory
        done();
      });
    });
  });

  describe('grep', () => {
    it('filter by scenario tags', (done) => {
      exec(`${codecept_run} --grep @slow`, (err, stdout) => {
        expect(stdout).to.include('Filesystem'); // feature
        expect(stdout).to.include('check current dir'); // test name
        assert(!err);
        done();
      });
    });

    it('filter by scenario tags #2', (done) => {
      exec(`${codecept_run} --grep @important`, (err, stdout) => {
        expect(stdout).to.include('Filesystem'); // feature
        expect(stdout).to.include('check current dir'); // test name
        assert(!err);
        done();
      });
    });

    it('filter by feature tags', (done) => {
      exec(`${codecept_run} --grep @main`, (err, stdout) => {
        expect(stdout).to.include('Filesystem'); // feature
        expect(stdout).to.include('check current dir'); // test name
        assert(!err);
        done();
      });
    });

    describe('without "invert" option', () => {
      it('should filter by scenario tags', (done) => {
        exec(`${codecept_run_config('codecept.grep.2.js')} --grep @1_grep`, (err, stdout) => {
          expect(stdout).to.include('@feature_grep'); // feature
          expect(stdout).to.include('grep message 1');
          expect(stdout).to.not.include('grep message 2');
          assert(!err);
          done();
        });
      });

      it('should filter by scenario tags #2', (done) => {
        exec(`${codecept_run_config('codecept.grep.2.js')} --grep @2_grep`, (err, stdout) => {
          expect(stdout).to.include('@feature_grep'); // feature
          expect(stdout).to.include('grep message 2');
          expect(stdout).to.not.include('grep message 1');
          assert(!err);
          done();
        });
      });

      it('should filter by feature tags', (done) => {
        exec(`${codecept_run_config('codecept.grep.2.js')} --grep @feature_grep`, (err, stdout) => {
          expect(stdout).to.include('@feature_grep'); // feature
          expect(stdout).to.include('grep message 1');
          expect(stdout).to.include('grep message 2');
          assert(!err);
          done();
        });
      });
    });

    describe('with "invert" option', () => {
      it('should filter by scenario tags', (done) => {
        exec(`${codecept_run_config('codecept.grep.2.js')} --grep @1_grep --invert`, (err, stdout) => {
          expect(stdout).to.include('@feature_grep'); // feature
          expect(stdout).to.not.include('grep message 1');
          expect(stdout).to.include('grep message 2');
          assert(!err);
          done();
        });
      });

      it('should filter by scenario tags #2', (done) => {
        exec(`${codecept_run_config('codecept.grep.2.js')} --grep @2_grep --invert`, (err, stdout) => {
          expect(stdout).to.include('@feature_grep'); // feature
          expect(stdout).to.not.include('grep message 2');
          expect(stdout).to.include('grep message 1');
          assert(!err);
          done();
        });
      });

      it('should filter by feature tags', (done) => {
        exec(`${codecept_run_config('codecept.grep.2.js')} --grep @main --invert`, (err, stdout) => {
          expect(stdout).to.include('@feature_grep'); // feature
          expect(stdout).to.include('grep message 1');
          expect(stdout).to.include('grep message 2');
          assert(!err);
          done();
        });
      });

      it('should filter by feature tags', (done) => {
        exec(`${codecept_run_config('codecept.grep.2.js')} --grep @feature_grep --invert`, (err, stdout) => {
          expect(stdout).to.not.include('@feature_grep'); // feature
          expect(stdout).to.not.include('grep message 1');
          expect(stdout).to.not.include('grep message 2');
          assert(!err);
          done();
        });
      });
    });
  });

  it('should run hooks from suites', (done) => {
    exec(codecept_run_config('codecept.testhooks.json'), (err, stdout) => {
      const lines = stdout.match(/\S.+/g);

      const uniqueLines = lines.filter((v, i, a) => a.indexOf(v) === i);

      expect(uniqueLines.length).to.eql(lines.length, `No duplicates in output +${lines} \n\n -${uniqueLines}`);

      expect(lines).to.include.members([
        'Helper: I\'m initialized',
        'Helper: I\'m simple BeforeSuite hook',
        'Test: I\'m simple BeforeSuite hook',
        'Test: I\'m generator BeforeSuite hook',
        'Test: I\'m async/await BeforeSuite hook',
        'Helper: I\'m simple Before hook',
        'Test: I\'m simple Before hook',
        'Test: I\'m generator Before hook',
        'Test: I\'m async/await Before hook',
        'Test: I\'m generator After hook',
        'Test: I\'m simple After hook',
        'Test: I\'m async/await After hook',
        'Helper: I\'m simple After hook',
        'Test: I\'m generator AfterSuite hook',
        'Test: I\'m simple AfterSuite hook',
        'Test: I\'m async/await AfterSuite hook',
        'Helper: I\'m simple AfterSuite hook',
      ]);

      expect(stdout).to.include('1 passed');
      assert(!err);
      done();
    });
  });

  it('should run hooks from suites (in different order)', (done) => {
    exec(codecept_run_config('codecept.testhooks.different.order.json'), (err, stdout) => {
      const lines = stdout.match(/\S.+/g);

      expect(lines).to.include.members([
        'Helper: I\'m simple BeforeSuite hook',
        'Test: I\'m async/await BeforeSuite hook',
        'Helper: I\'m simple Before hook',
        'Test: I\'m async/await Before hook',
        'Test: I\'m async/await After hook',
        'Helper: I\'m simple After hook',
        'Test: I\'m async/await AfterSuite hook',
        'Helper: I\'m simple AfterSuite hook',
      ]);
      expect(stdout).to.include('1 passed');
      assert(!err);
      done();
    });
  });

  it('should run different types of scenario', (done) => {
    exec(codecept_run_config('codecept.testscenario.json'), (err, stdout) => {
      const lines = stdout.match(/\S.+/g);
      expect(lines).to.include.members([
        'It\'s usual test',
        'Test: I\'m async/await test',
        'Test: I\'m asyncbrackets test',
      ]);
      expect(stdout).to.include('3 passed');
      assert(!err);
      done();
    });
  });

  it('should run dynamic config', (done) => {
    exec(codecept_run_config('config.js'), (err, stdout) => {
      expect(stdout).to.include('Filesystem'); // feature
      assert(!err);
      done();
    });
  });

  it('should run dynamic config with profile', (done) => {
    exec(`${codecept_run_config('config.js')} --profile failed`, (err, stdout) => {
      expect(stdout).to.include('FAILURES');
      expect(stdout).to.not.include('I am bootstrap');
      assert(err.code);
      done();
    });
  });

  it('should exit code 1 when error in config', (done) => {
    exec(`${codecept_run_config('configs/codecept-invalid.config.js')} --profile failed`, (err, stdout, stderr) => {
      expect(stdout).to.not.include('UnhandledPromiseRejectionWarning');
      expect(stdout).to.not.include('UnhandledPromiseRejectionWarning');
      expect(stdout).to.include('badFn is not defined');
      assert(err.code);
      done();
    });
  });

  describe('with require parameter', () => {
    const moduleOutput = 'Module was required 1';
    const moduleOutput2 = 'Module was required 2';

    it('should be executed with module when described', (done) => {
      exec(codecept_run_config('codecept.require.single.json'), (err, stdout) => {
        expect(stdout).to.include(moduleOutput);
        expect(stdout).to.not.include(moduleOutput2);
        assert(!err);
        done();
      });
    });

    it('should be executed with several modules when described', (done) => {
      exec(codecept_run_config('codecept.require.several.json'), (err, stdout) => {
        expect(stdout).to.include(moduleOutput);
        expect(stdout).to.include(moduleOutput2);
        assert(!err);
        done();
      });
    });

    it('should not be executed without module when not described', (done) => {
      exec(codecept_run_config('codecept.require.without.json'), (err, stdout) => {
        expect(stdout).to.not.include(moduleOutput);
        expect(stdout).to.not.include(moduleOutput2);
        assert(!err);
        done();
      });
    });
  });
});

describe('Codeceptjs Events', () => {
  it('should fire events with only passing tests', (done) => {
    exec(`${codecept_run_config('codecept.testevents.js')} --grep @willpass`, (err, stdout) => {
      assert(!err);
      const eventMessages = stdout.split('\n')
        .filter(text => text.startsWith('Event:'))
        .map(text => text.replace(/^Event:/i, ''));

      expect([
        event.all.before,
        event.suite.before,
        event.test.before,
        event.test.started,
        event.test.passed,
        `${event.test.passed} (helper)`,
        event.test.after,
        event.suite.after,
        event.all.result,
        event.all.after,
      ]).to.include.members(eventMessages);
      done();
    });
  });

  it('should fire events with passing and failing tests', (done) => {
    exec(codecept_run_config('codecept.testevents.js'), (err, stdout) => {
      assert(err);
      const eventMessages = stdout.split('\n')
        .filter(text => text.startsWith('Event:'))
        .map(text => text.replace(/^Event:/i, ''));

      expect([
        event.all.before,
        event.suite.before,

        // Test 1 (should pass)
        event.test.before,
        event.test.started,
        event.test.passed,
        `${event.test.passed} (helper)`,
        event.test.after,

        // Test 2 (should fail)
        event.test.before,
        event.test.started,
        event.test.failed,
        `${event.test.failed} (helper)`,
        event.test.after,

        event.suite.after,
        event.all.result,
        event.all.after,
      ]).to.include.members(eventMessages);
      done();
    });
  });
});
