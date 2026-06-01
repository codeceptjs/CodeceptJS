import os from 'os'
import { expect } from 'chai'
import { exec } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const codeceptRun = `"${path.resolve(__dirname, '../../bin/codecept.js')}"`

describe('CLI Sharding Integration', () => {
  let tempDir
  let configFile

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shard_test_'))
    configFile = path.join(tempDir, 'codecept.conf.js')

    fs.mkdirSync(tempDir, { recursive: true })

    for (let i = 1; i <= 4; i++) {
      fs.writeFileSync(
        path.join(tempDir, `shard_test${i}.js`),
        `
Feature('Shard Test ${i}')

Scenario('test ${i}', ({ I }) => {
  I.say('This is test ${i}')
})
        `,
      )
    }

    fs.writeFileSync(
      configFile,
      `
exports.config = {
  tests: ${JSON.stringify(path.join(tempDir, 'shard_test*.js'))},
  output: ${JSON.stringify(path.join(tempDir, 'output'))},
  helpers: {
    FileSystem: {}
  },
  include: {},
  bootstrap: null,
  mocha: {},
  name: 'shard-test'
}
      `,
    )
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('should run tests with shard option', function (done) {
    this.timeout(10000)

    exec(`node ${codeceptRun} run --config "${configFile}" --shard 1/4`, (err, stdout) => {
      expect(stdout).to.contain('CodeceptJS')
      expect(stdout).to.contain('OK')
      expect(stdout).to.match(/1 passed/)
      expect(err).to.be.null
      done()
    })
  })

  it('should handle invalid shard format', function (done) {
    this.timeout(10000)

    exec(`node ${codeceptRun} run --config "${configFile}" --shard invalid`, (err, stdout) => {
      expect(stdout).to.contain('Invalid shard format')
      expect(err.code).to.equal(1)
      done()
    })
  })

  it('should handle shard index out of range', function (done) {
    this.timeout(10000)

    exec(`node ${codeceptRun} run --config "${configFile}" --shard 0/4`, (err, stdout) => {
      expect(stdout).to.contain('Shard index 0 must be between 1 and 4')
      expect(err.code).to.equal(1)
      done()
    })
  })

  it('should distribute tests correctly across all shards', function (done) {
    this.timeout(20000)

    const shardResults = []
    let completedShards = 0
    let finished = false

    for (let i = 1; i <= 4; i++) {
      exec(`node ${codeceptRun} run --config "${configFile}" --shard ${i}/4`, (err, stdout) => {
        if (finished) return

        try {
          expect(err).to.be.null
          expect(stdout).to.contain('OK')
          expect(stdout).to.match(/1 passed/)

          shardResults.push(i)
          completedShards++

          if (completedShards === 4) {
            finished = true
            expect(shardResults).to.have.lengthOf(4)
            done()
          }
        } catch (e) {
          finished = true
          done(e)
        }
      })
    }
  })
})
