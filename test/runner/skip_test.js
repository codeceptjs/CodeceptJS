import * as chai from 'chai';
chai.should();
import assert from 'assert';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runner = path.join(__dirname, '/../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/skip')
const codecept_run = `${runner} run --config ${codecept_dir}/codecept.conf.js `

describe('Skip', () => {
  it('should skip test with skip', done => {
    exec(`${codecept_run}`, (err, stdout) => {
      stdout.should.include('S @skip')
      stdout.should.include('S @skip with opts')
      stdout.should.not.include('skip test not passed')
      stdout.should.include('✔ @NotSkip in')
      assert(!err)
      done()
    })
  })

  it('should correctly pass custom opts for skip test', done => {
    exec(`${codecept_run}`, (err, stdout) => {
      stdout.should.include('test @skip with opts was marked for skip with customOpts: "Custom options for skip"')
      assert(!err)
      done()
    })
  })
})
