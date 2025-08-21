import path from 'path'
import chai from 'chai'

chai.should()
import { fileURLToPath } from 'url'
import chai from 'chai'

chai.should()

import assert from 'assert'
import chai from 'chai'

chai.should()
import { exec } from 'child_process'
import chai from 'chai'

chai.should()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const runner = path.join(__dirname, '/../../bin/codecept.js')

describe('help option', () => {
  it('should print help message with --help option', done => {
    exec(`${runner} --help`, (err, stdout) => {
      stdout.should.include('Usage:')
      stdout.should.include('Options:')
      stdout.should.include('Commands:')
      assert(!err)
      done()
    })
  })

  it('should print help message with -h option', done => {
    exec(`${runner} -h`, (err, stdout) => {
      stdout.should.include('Usage:')
      stdout.should.include('Options:')
      stdout.should.include('Commands:')
      assert(!err)
      done()
    })
  })

  it('should print help message with no option', done => {
    exec(`${runner}`, (err, stdout) => {
      stdout.should.include('Usage:')
      stdout.should.include('Options:')
      stdout.should.include('Commands:')
      assert(!err)
      done()
    })
  })
})
