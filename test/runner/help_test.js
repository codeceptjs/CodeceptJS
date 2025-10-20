const assert = require('assert')
const path = require('path')
const exec = require('child_process').exec

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
