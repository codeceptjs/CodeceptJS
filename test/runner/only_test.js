import path from 'path'
import { exec } from 'child_process'
import assert from 'assert'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const runner = path.join(__dirname, '/../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/only')
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.conf.cjs `

describe('Feature.only', () => {
  it('should run only scenarios in Feature.only and skip other features', done => {
    exec(`${codecept_run} only_test.js`, (err, stdout, stderr) => {
      stdout.should.include('Only Scenario 1 was executed')
      stdout.should.include('Only Scenario 2 was executed')
      stdout.should.include('Only Scenario 3 was executed')
      stdout.should.not.include('Regular Scenario 1 should NOT execute')
      stdout.should.not.include('Regular Scenario 2 should NOT execute')
      stdout.should.not.include('Another Regular Scenario should NOT execute')

      // Should show 3 passing tests
      stdout.should.include('3 passed')

      assert(!err)
      done()
    })
  })

  it('should work when there are multiple features with Feature.only selecting one', done => {
    exec(`${codecept_run} only_test.js`, (err, stdout, stderr) => {
      // Should only run the @OnlyFeature scenarios
      stdout.should.include('@OnlyFeature --')
      stdout.should.include('✔ @OnlyScenario1')
      stdout.should.include('✔ @OnlyScenario2')
      stdout.should.include('✔ @OnlyScenario3')

      // Should not include other features
      stdout.should.not.include('@RegularFeature')
      stdout.should.not.include('@AnotherRegularFeature')

      assert(!err)
      done()
    })
  })
})
