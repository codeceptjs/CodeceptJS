import * as chai from 'chai'
chai.should()
import path from 'path'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const runner = path.join(__dirname, '/../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/internal-api-tsx-cjs')
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.conf.ts`

// Regression test for https://github.com/codeceptjs/CodeceptJS/issues/5635
// The internal API (config/container/recorder/event/store, and the effects that delegate to them)
// must resolve to the live singletons when imported from a test through a CommonJS loader (tsx/cjs),
// not a second, disconnected copy. Drives a real tsx/cjs project once and asserts on its output.
describe('CodeceptJS internal API under tsx/cjs', function () {
  this.timeout(40000)

  let stdout = ''
  let runErr = null

  // Run the fixture once; the `timeout` kills the child if a regression makes retryTo() hang forever
  // (its manual promise never resolves on a disconnected recorder), so a broken fix fails on the
  // missing markers instead of hanging the whole suite.
  before(done => {
    exec(`${codecept_run}`, { timeout: 30000 }, (err, out) => {
      runErr = err
      stdout = out
      done()
    })
  })

  it('resolves config/container/recorder/event/store to the live singletons from a test', () => {
    stdout.should.include('5 passed')
    // config (#5635): the real config the runner loaded, not an empty {}
    stdout.should.include('API_CONFIG name=internal-api-tsx-cjs-test')
    stdout.should.include('API_CONFIG marker=config-marker-123')
    // container: the live helpers map populated by the runner
    stdout.should.include('API_CONTAINER helper=object')
    // store: initialized by the runner
    stdout.should.include('API_STORE hasDir=true')
    // recorder: started by the runner for this test
    stdout.should.include('API_RECORDER running=true')
    // event: the live dispatcher the framework subscribes to
    stdout.should.include('API_EVENT live=true')
    // helper (ESM realm) reads the same live config
    stdout.should.include('API_HELPER marker=config-marker-123')
    chai.expect(runErr).to.be.null
  })

  it('runs within/tryTo/hopeThat/retryTo imported through the CJS loader', () => {
    // tryTo ran its callback and resolved to false (a failed try), instead of returning
    // undefined from a disconnected, never-started recorder
    stdout.should.include('EFFECTS_TRYTO result=false')
    // within() applied its context so the inner step saw _withinBegin
    stdout.should.include('EFFECTS_CLICK withinActive=true')
    // hopeThat() ran its callback and resolved to true
    stdout.should.include('EFFECTS_PASS ran')
    stdout.should.include('EFFECTS_HOPETHAT result=true')
    // retryTo() retried the flaky callback until it passed (and did not hang)
    stdout.should.include('EFFECTS_FLAKY try=2')
    stdout.should.include('EFFECTS_RETRY done')
  })
})
