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
// The internal API (config/container/recorder/event/store) must resolve to the live
// singletons when imported from a test through a CommonJS loader (tsx/cjs), not a second,
// disconnected copy. Drives a real tsx/cjs project and asserts each one is the live instance.
describe('CodeceptJS internal API under tsx/cjs', function () {
  this.timeout(40000)

  it('resolves config/container/recorder/event/store to the live singletons from a test', done => {
    exec(`${codecept_run}`, { timeout: 30000 }, (err, stdout) => {
      stdout.should.include('1 passed')
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
      chai.expect(err).to.be.null
      done()
    })
  })
})
