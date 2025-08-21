import path from 'path'
import { fileURLToPath } from 'url'

import { exec } from 'child_process'
import assert from 'assert'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const runner = path.join(__dirname, '/../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/translation')
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.conf.js `

describe('Translation', () => {
  it('Should run translated test file', done => {
    exec(`${codecept_run}`, err => {
      assert(!err)
      done()
    })
  })
})
