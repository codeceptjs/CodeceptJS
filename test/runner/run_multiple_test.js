import * as chai from 'chai';
chai.should();
import assert from 'assert';
import { expect } from 'expect';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runner = path.join(__dirname, '/../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/sandbox')
const codecept_run = `${runner} run-multiple --config ${codecept_dir}/codecept.multiple.js `

describe('CodeceptJS Multiple Runner', function () {
  this.timeout(40000)

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox')
  })

  it('should execute one suite with browser', done => {
    exec(`${codecept_run}default:firefox`, (err, stdout) => {
      stdout.should.include('CodeceptJS') // feature
      stdout.should.include('.default:firefox] print browser ')
      stdout.should.not.include('.default:chrome] print browser ')
      assert(!err)
      done()
    })
  })

  it('should execute all suites', done => {
    exec(`${codecept_run}--all`, (err, stdout) => {
      stdout.should.include('CodeceptJS') // feature
      stdout.should.include('[1.default:chrome] print browser ')
      stdout.should.include('[2.default:firefox] print browser ')
      stdout.should.include('[3.mobile:android] print browser ')
      stdout.should.include('[4.mobile:safari] print browser ')
      stdout.should.include('[5.mobile:chrome] print browser ')
      stdout.should.include('[6.mobile:safari] print browser ')
      stdout.should.include('[7.grep:chrome] @grep print browser size ')
      stdout.should.include('[8.grep:firefox] @grep print browser size ')
      stdout.should.not.include('[7.grep:chrome] print browser ')
      stdout.should.include('[1.default:chrome] @grep print browser size ')
      stdout.should.include('[3.mobile:android] @grep print browser size ')
      assert(!err)
      done()
    })
  })

  it('should replace parameters', done => {
    exec(`${codecept_run}grep --debug`, (err, stdout) => {
      stdout.should.include('CodeceptJS') // feature
      stdout.should.include('[1.grep:chrome]     › maximize')
      stdout.should.include('[2.grep:firefox]     › 1200x840')
      assert(!err)
      done()
    })
  })

  it('should execute multiple suites', done => {
    exec(`${codecept_run}mobile default `, (err, stdout) => {
      stdout.should.include('CodeceptJS') // feature
      stdout.should.include('[1.mobile:android] print browser ')
      stdout.should.include('[2.mobile:safari] print browser ')
      stdout.should.include('[3.mobile:chrome] print browser ')
      stdout.should.include('[4.mobile:safari] print browser ')
      stdout.should.include('[5.default:chrome] print browser ')
      stdout.should.include('[6.default:firefox] print browser ')
      assert(!err)
      done()
    })
  })

  it('should execute multiple suites with selected browsers', done => {
    exec(`${codecept_run}mobile:safari default:chrome `, (err, stdout) => {
      stdout.should.include('CodeceptJS') // feature
      stdout.should.include('[1.mobile:safari] print browser ')
      stdout.should.include('[2.mobile:safari] print browser ')
      stdout.should.include('[3.default:chrome] print browser ')
      assert(!err)
      done()
    })
  })

  it('should print steps', done => {
    exec(`${codecept_run}default --steps`, (err, stdout) => {
      stdout.should.include('CodeceptJS') // feature
      stdout.should.include('[2.default:firefox]   print browser ')
      stdout.should.include('[2.default:firefox]     I print browser ')
      stdout.should.include('[1.default:chrome]   print browser ')
      stdout.should.include('[1.default:chrome]     I print browser ')
      assert(!err)
      done()
    })
  })

  it('should pass grep to configuration', done => {
    exec(`${codecept_run}default --grep @grep`, (err, stdout) => {
      stdout.should.include('CodeceptJS') // feature
      stdout.should.include('[1.default:chrome] @grep print browser size')
      stdout.should.include('[2.default:firefox] @grep print browser size')
      stdout.should.not.include('[1.default:chrome] print browser ')
      stdout.should.not.include('[2.default:firefox] print browser ')
      assert(!err)
      done()
    })
  })

  it('should pass grep invert to configuration', done => {
    exec(`${codecept_run}default --grep @grep --invert`, (err, stdout) => {
      stdout.should.include('CodeceptJS') // feature
      stdout.should.not.include('[1.default:chrome] @grep print browser size')
      stdout.should.not.include('[2.default:firefox] @grep print browser size')
      stdout.should.include('[1.default:chrome] print browser ')
      stdout.should.include('[2.default:firefox] print browser ')
      assert(!err)
      done()
    })
  })

  it('should pass tests to configuration', done => {
    exec(`${codecept_run}test`, (err, stdout) => {
      stdout.should.include('CodeceptJS') // feature
      stdout.should.include('[1.test:chrome] print browser size')
      stdout.should.include('[2.test:firefox] print browser size')
      stdout.should.include('[1.test:chrome] print browser ')
      stdout.should.include('[2.test:firefox] print browser ')
      assert(!err)
      done()
    })
  })

  it('should run chunks', done => {
    exec(`${codecept_run}chunks`, (err, stdout) => {
      stdout.should.include('CodeceptJS') // feature
      stdout.should.match(/chunks:chunk\d:dummy].+print browser/i)
      stdout.should.match(/chunks:chunk\d:dummy].+@grep print browser size/i)
      assert(!err)
      done()
    })
  })

  it('should run features in parallel', done => {
    process.chdir(codecept_dir)
    exec(`${runner} run-multiple --config codecept.multiple.features.js chunks --features  --grep '(?=.*)^(?!.*@fail)'`, (err, stdout) => {
      stdout.should.match(/\[\d\.chunks:chunk\d:default\] Checkout examples process/)
      // stdout.should.not.match(/\[\d\.chunks:chunk\d:default\] Checkout examples process/)
      stdout.should.match(/\[\d\.chunks:chunk\d:default\] Checkout string/)
      // stdout.should.not.match(/\[\d\.chunks:chunk\d:default\] Checkout string/)
      stdout.should.match(/\[\d\.chunks:chunk\d:default\] {3}OK {2}\|/)
      stdout.should.match(/\[\d\.chunks:chunk\d:default\] {3}OK {2}\|/)
      stdout.should.not.include('@feature_grep')
      assert(!err)
      done()
    })
  })

  it('should run features & tests in parallel', done => {
    process.chdir(codecept_dir)
    exec(`${runner} run-multiple --config codecept.multiple.features.js chunks --grep '(?=.*)^(?!.*@fail)'`, (err, stdout) => {
      stdout.should.include('@feature_grep')
      stdout.should.include('Checkout examples process')
      stdout.should.include('Checkout string')
      assert(!err)
      done()
    })
  })

  it('should run only tests in parallel', done => {
    process.chdir(codecept_dir)
    exec(`${runner} run-multiple --config codecept.multiple.features.js chunks --tests`, (err, stdout) => {
      stdout.should.include('@feature_grep')
      stdout.should.not.include('Checkout examples process')
      stdout.should.not.include('Checkout string')
      assert(!err)
      done()
    })
  })

  it('should exit with non-zero code for failures during init process', done => {
    process.chdir(codecept_dir)
    exec(`${runner} run-multiple --config codecept.multiple.initFailure.js default --all`, (err, stdout, stderr) => {
      expect(err).not.toBeFalsy()
      expect(err.code).toBe(1)
      expect(stdout + stderr).toContain('Failed on FailureHelper')
      done()
    })
  })

  it('should exit code 1 when error in config', done => {
    process.chdir(codecept_dir)
    exec(`${runner} run-multiple --config configs/codecept-invalid.config.js default --all`, (err, stdout, stderr) => {
      expect(stdout).not.toContain('UnhandledPromiseRejectionWarning')
      expect(stderr).not.toContain('UnhandledPromiseRejectionWarning')
      expect(stdout).toContain('badFn is not defined')
      expect(err).not.toBe(null)
      done()
    })
  })

  it('should load plugins with runInWorker:false in each child process and give each its own reportDir', done => {
    exec(`${runner} run-multiple --config ${codecept_dir}/codecept.multiple.plugin.runInWorkerFalse.js default`, (err, stdout) => {
      // Plugin must be initialised once per forked child (chrome + firefox = 2 times).
      // Regression: in 4.x the plugin was silently skipped because options.child was
      // truthy in run-multiple children, same as in worker threads.
      ;(stdout.match(/plugin-runInWorkerFalse:loaded/g) || []).should.have.lengthOf(2)
      // reportDir must be replaced per child so each child writes its own report.
      // Regression: run-multiple.js dropped the replaceValueDeep('reportDir', ...) call
      // that was present in 3.x, causing all children to overwrite the same file.
      const dirs = (stdout.match(/plugin-runInWorkerFalse:reportDir=(.+)/g) || []).map(m => m.split('=')[1])
      dirs.should.have.lengthOf(2)
      dirs[0].should.not.equal(dirs[1])
      assert(!err)
      done()
    })
  })

  describe('bootstrapAll and teardownAll', () => {
    const _codecept_run = `run-multiple --config ${codecept_dir}`
    it('should be executed from async function in config', done => {
      exec(`${runner} ${_codecept_run}/codecept.async.bootstrapall.multiple.code.js default`, (err, stdout) => {
        stdout.should.include('CodeceptJS') // feature
        stdout.should.include('Results: inside Promise\n"event.multiple.before" is called')
        stdout.should.include('"teardownAll" is called.')
        assert(!err)
        done()
      })
    })

    it('should be executed from function in config', done => {
      exec(`${runner} ${_codecept_run}/codecept.bootstrapall.multiple.code.js default`, (err, stdout) => {
        stdout.should.include('CodeceptJS') // feature
        stdout.should.include('"bootstrapAll" is called.')
        stdout.should.include('"teardownAll" is called.')
        assert(!err)
        done()
      })
    })
  })

  describe('with require parameter', () => {
    const _codecept_run = `run-multiple --config ${codecept_dir}`
    const moduleOutput = 'Module was required 1'
    const moduleOutput2 = 'Module was required 2'

    it('should be executed with module when described', done => {
      process.chdir(codecept_dir)
      exec(`${runner} ${_codecept_run}/codecept.require.multiple.single.json default`, (err, stdout) => {
        stdout.should.include(moduleOutput)
        stdout.should.not.include(moduleOutput2)
        ;(stdout.match(new RegExp(moduleOutput, 'g')) || []).should.have.lengthOf(2)
        assert(!err)
        done()
      })
    })

    it('should be executed with several module when described', done => {
      process.chdir(codecept_dir)
      exec(`${runner} ${_codecept_run}/codecept.require.multiple.several.js default`, (err, stdout) => {
        stdout.should.include(moduleOutput)
        stdout.should.include(moduleOutput2)
        ;(stdout.match(new RegExp(moduleOutput, 'g')) || []).should.have.lengthOf(2)
        ;(stdout.match(new RegExp(moduleOutput2, 'g')) || []).should.have.lengthOf(2)
        assert(!err)
        done()
      })
    })

    it('should not be executed without module when not described', done => {
      process.chdir(codecept_dir)
      exec(`${runner} ${_codecept_run}/codecept.require.multiple.without.json default`, (err, stdout) => {
        stdout.should.not.include(moduleOutput)
        stdout.should.not.include(moduleOutput2)
        assert(!err)
        done()
      })
    })
  })
})
