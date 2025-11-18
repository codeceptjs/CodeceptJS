import * as chai from 'chai';
chai.should();
import assert from 'assert';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
