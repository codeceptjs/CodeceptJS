import * as chai from 'chai';
chai.should();
import assert from 'assert';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runner = path.join(__dirname, '/../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/sandbox')
const codecept_config = path.join(codecept_dir, 'codecept.js')

describe('list commands', () => {
  it('list should print actions', done => {
    exec(`${runner} list ${codecept_dir}`, (err, stdout) => {
      stdout.should.include('FileSystem')
      stdout.should.include('FileSystem I.amInPath(openPath)')
      stdout.should.include('FileSystem I.seeFile(name)')
      assert(!err)
      done()
    })
  })

  it('list should accept -c with a config file path', done => {
    exec(`${runner} list -c ${codecept_config}`, (err, stdout) => {
      stdout.should.include('FileSystem I.amInPath(openPath)')
      stdout.should.include('FileSystem I.seeFile(name)')
      assert(!err)
      done()
    })
  })

  it('list --docs should print JSDoc descriptions for actions', done => {
    exec(`${runner} list --docs -c ${codecept_config}`, (err, stdout) => {
      stdout.should.include('FileSystem I.amInPath(openPath)')
      stdout.should.include('Enters a directory In local filesystem.')
      stdout.should.include('FileSystem I.seeFile(name)')
      stdout.should.include('Checks that file exists')
      assert(!err)
      done()
    })
  })

  it('list --action filters to a single action and implies --docs', done => {
    exec(`${runner} list --action seeFile -c ${codecept_config}`, (err, stdout) => {
      stdout.should.include('FileSystem I.seeFile(name)')
      stdout.should.include('Checks that file exists')
      stdout.should.not.include('I.amInPath(')
      stdout.should.not.include('List of test actions:')
      assert(!err)
      done()
    })
  })

  it('list --action accepts the I. prefix', done => {
    exec(`${runner} list --action I.seeFile -c ${codecept_config}`, (err, stdout) => {
      stdout.should.include('FileSystem I.seeFile(name)')
      stdout.should.include('Checks that file exists')
      stdout.should.not.include('I.amInPath(')
      assert(!err)
      done()
    })
  })

  it('list --action prints a not-found message for an unknown action', done => {
    exec(`${runner} list --action doesNotExist -c ${codecept_config}`, (err, stdout) => {
      stdout.should.include('No action named')
      stdout.should.include('doesNotExist')
      assert(!err)
      done()
    })
  })
})
