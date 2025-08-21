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
const codecept_dir = path.join(__dirname, '/../data/sandbox')

describe('list commands', () => {
  it('list should print actions', done => {
    exec(`${runner} list ${codecept_dir}`, (err, stdout) => {
      stdout.should.include('FileSystem') // helper name
      stdout.should.include('FileSystem I.amInPath(openPath)') // action name
      stdout.should.include('FileSystem I.seeFile(name)')
      assert(!err)
      done()
    })
  })
})
