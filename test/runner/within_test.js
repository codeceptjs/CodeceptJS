import chai from 'chai';
chai.should();
import path from 'path'
import { exec } from 'child_process'
import { fileURLToPath } from 'url';
import { test } from '../../lib/utils.js'
const { grepLines } = test

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const runner = path.join(__dirname, '/../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/sandbox')
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.within.json `

let testStatus

describe('CodeceptJS within', function () {
  this.timeout(40000)

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox')
  })

  it('should execute if no generators', done => {
    exec(`${codecept_run} --debug`, (_err, stdout) => {
      const lines = stdout.match(/\S.+/g)

      const withoutGeneratorList = grepLines(lines, 'Check within without generator', 'Check within with generator. Yield is first in order')
      testStatus = withoutGeneratorList.find(line => line.includes('OK'))
      testStatus.should.include('OK')
      const stepsList = withoutGeneratorList.filter(line => !line.includes('OK'))
      stepsList.should.eql(
        ['Scenario()', 'I small promise ', 'I small promise was finished ', 'I hey! i am within begin. i get blabla ', 'Within "blabla"', 'I small promise ', 'I small promise was finished ', 'I oh! i am within end( '],
        'check steps execution order',
      )
      done()
    })
  })

  it('should execute with async/await. Await is first in order', done => {
    exec(`${codecept_run} --debug`, (_err, stdout) => {
      const lines = stdout.match(/\S.+/g)

      const withGeneratorList = grepLines(lines, 'Check within with async/await. Await is first in order', 'Check within with async/await. Await is second in order')
      testStatus = withGeneratorList.find(line => line.includes('OK'))
      testStatus.should.include('OK')
      const stepsList = withGeneratorList.filter(line => !line.includes('OK'))
      stepsList.should.eql(
        [
          'Scenario()',
          'I small promise ',
          'I small promise was finished ',
          'I small yield ',
          'I am small yield string await',
          'I hey! i am within begin. i get blabla ',
          'Within "blabla"',
          'I small yield ',
          'I am small yield string await',
          'I small promise ',
          'I small promise was finished ',
          'I oh! i am within end( ',
        ],
        'check steps execution order',
      )

      done()
    })
  })

  it('should execute with async/await. Await is second in order', done => {
    exec(`${codecept_run} --debug`, (_err, stdout) => {
      const lines = stdout.match(/\S.+/g)

      const withGeneratorList = grepLines(lines, 'Check within with async/await. Await is second in order', '-- FAILURES:')
      testStatus = withGeneratorList.find(line => line.includes('OK'))
      testStatus.should.include('OK')
      const stepsList = withGeneratorList.filter(line => !line.includes('OK'))
      stepsList.should.eql(
        [
          'Scenario()',
          'I small promise ',
          'I small promise was finished ',
          'I small yield ',
          'I am small yield string await',
          'I hey! i am within begin. i get blabla ',
          'Within "blabla"',
          'I small promise ',
          'I small promise was finished ',
          'I small yield ',
          'I am small yield string await',
          'I oh! i am within end( ',
        ],
        'check steps execution order',
      )

      done()
    })
  })
})
