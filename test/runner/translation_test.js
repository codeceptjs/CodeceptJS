import chai from 'chai';
chai.should();
import assert from 'assert';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
