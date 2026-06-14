import * as chai from 'chai'
chai.should()
import path from 'path'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const runner = path.join(__dirname, '/../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/config-tsx-cjs')
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.conf.ts`

// Regression test for https://github.com/codeceptjs/CodeceptJS/issues/5635
// When the internal API (config) is imported through a CommonJS loader (tsx/cjs) a second,
// disconnected copy of config.js was loaded, so config.get() returned {} from tests/page
// objects while helpers (loaded via import()) saw the real config.
describe('CodeceptJS config under tsx/cjs', function () {
  this.timeout(40000)

  it('config.get() reads the live config from a test imported via tsx/cjs', done => {
    exec(`${codecept_run}`, { timeout: 30000 }, (err, stdout) => {
      stdout.should.include('1 passed')
      // the test (CJS realm) reads the real config the runner loaded, not an empty {}
      stdout.should.include('CONFIG_FROM_TEST name=config-tsx-cjs-test')
      stdout.should.include('CONFIG_FROM_TEST marker=config-marker-123')
      // the helper (ESM realm) reads the same live config
      stdout.should.include('CONFIG_FROM_HELPER marker=config-marker-123')
      chai.expect(err).to.be.null
      done()
    })
  })
})
