import * as chai from 'chai'
chai.should()
import path from 'path'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const runner = path.join(__dirname, '/../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/effects-tsx-cjs')
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.conf.ts`

// Regression test for https://github.com/codeceptjs/CodeceptJS/issues/5632
// When effects are imported through a CommonJS loader (tsx/cjs) a second, disconnected
// copy of recorder/container was loaded, so within() and tryTo() silently did nothing.
describe('CodeceptJS effects under tsx/cjs', function () {
  this.timeout(40000)

  // `timeout` kills the child if a regression makes retryTo() hang forever (its
  // manual promise never resolves on a disconnected recorder), so a broken fix
  // fails on the missing markers instead of hanging the whole suite.
  it('executes within(), tryTo(), hopeThat() and retryTo() when imported via tsx/cjs', done => {
    exec(`${codecept_run}`, { timeout: 30000 }, (err, stdout) => {
      stdout.should.include('4 passed')
      // tryTo ran its callback and resolved to false (a failed try), instead of
      // returning undefined from a disconnected, never-started recorder
      stdout.should.include('EFFECTS_TRYTO result=false')
      // within() applied its context so the inner step saw _withinBegin
      stdout.should.include('EFFECTS_CLICK withinActive=true')
      // hopeThat() ran its callback and resolved to true
      stdout.should.include('EFFECTS_PASS ran')
      stdout.should.include('EFFECTS_HOPETHAT result=true')
      // retryTo() retried the flaky callback until it passed
      stdout.should.include('EFFECTS_FLAKY try=2')
      stdout.should.include('EFFECTS_RETRY done')
      chai.expect(err).to.be.null
      done()
    })
  })
})
