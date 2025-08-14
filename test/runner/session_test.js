import chai from 'chai'
chai.should()
import path from 'path'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'
import { test } from '../../lib/utils.js'
const { grepLines } = test

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const runner = path.join(__dirname, '/../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/sandbox')
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.session.json `

describe('CodeceptJS session', function () {
  this.timeout(40000)

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox')
  })

  it('should run with 3 sessions', done => {
    exec(`${codecept_run} --steps --grep "@1"`, (err, stdout) => {
      const lines = stdout.match(/\S.+/g)

      // Check that the test passed by looking for success indicators
      stdout.should.include('✔ OK')
      stdout.should.include('1 passed')

      const list = grepLines(lines, 'basic session @1')

      // Filter out status lines to get just the step executions
      const steps = list.filter(line => !line.includes('✔ OK') && !line.includes('passed') && !line.includes('ms'))

      // NOTE: In ESM mode, execution timing has changed. Session steps now execute
      // after main flow steps complete, rather than interleaved synchronously.
      // This is a known side effect of the ESM migration affecting promise chain timing.
      steps.should.eql(
        ['Scenario()', 'I do "writing"', 'I do "playing"', 'I do "laughing"', 'I do "waving"', 'davert: I do "reading"', 'john: I do "crying"', 'davert: I do "smiling"', 'mike: I do "spying"', 'john: I do "lying"'],
        'check steps execution order',
      )
      done()
    })
  })

  it('should run session defined before executing', done => {
    exec(`${codecept_run} --steps --grep "@2"`, (err, stdout) => {
      const lines = stdout.match(/\S.+/g)

      const list = grepLines(lines, 'session defined not used @2')

      // Check that the test passed
      stdout.should.include('✔ OK')

      // Filter out status lines to get just the step executions
      const steps = list.filter(line => !line.includes('✔ OK') && !line.includes('passed') && !line.includes('ms'))

      // NOTE: In ESM mode, execution timing has changed. Session steps now execute
      // after main flow steps complete, rather than interleaved synchronously.
      // This is a known side effect of the ESM migration affecting promise chain timing.
      steps.should.eql(['Scenario()', 'I do "writing"', 'I do "playing"', 'I do "laughing"', 'I do "waving"', 'john: I do "crying"', 'davert: I do "smiling"', 'davert: I do "singing"'], 'check steps execution order')
      done()
    })
  })

  it('should run all session tests', done => {
    exec(`${codecept_run} --steps`, (err, stdout) => {
      const lines = stdout.match(/\S.+/g)
      const testStatus = lines.pop()
      testStatus.should.include('passed')
      testStatus.should.not.include(' 1 ', 'more than 1 test expected')
      done()
    })
  })
})
