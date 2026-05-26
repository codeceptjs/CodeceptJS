import { expect } from 'chai'
import { exec } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const codecept_run = `node ${path.resolve(__dirname, '../../bin/codecept.js')}`

describe('CLI Sharding Integration', () => {
  let tempDir
  let configFile

  beforeEach(() => {
    // Create temporary test setup
    tempDir = `/tmp/shard_test_${Date.now()}`
    configFile = path.join(tempDir, 'codecept.conf.js')

    // Create temp directory and test files
    fs.mkdirSync(tempDir, { recursive: true })

    // Create 4 test files
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

    // Create config file
    fs.writeFileSync(
      configFile,
      `
exports.config = {
  tests: '${tempDir}/shard_test*.js',
  output: '${tempDir}/output',
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
    // Cleanup temp files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch (err) {
      // Ignore cleanup errors
    }
  })

  it('should run tests with shard option', function (done) {
    this.timeout(10000)

    exec(`${codecept_run} run --config ${configFile} --shard 1/4`, (err, stdout, stderr) => {
      expect(stdout).to.contain('CodeceptJS')
      expect(stdout).to.contain('OK')
      expect(stdout).to.match(/1 passed/)
      expect(err).to.be.null
      done()
    })
  })

  it('should handle invalid shard format', function (done) {
    this.timeout(10000)

    exec(`${codecept_run} run --config ${configFile} --shard invalid`, (err, stdout, stderr) => {
      expect(stdout).to.contain('Invalid shard format')
      expect(err.code).to.equal(1)
      done()
    })
  })

  it('should handle shard index out of range', function (done) {
    this.timeout(10000)

    exec(`${codecept_run} run --config ${configFile} --shard 0/4`, (err, stdout, stderr) => {
      expect(stdout).to.contain('Shard index 0 must be between 1 and 4')
      expect(err.code).to.equal(1)
      done()
    })
  })

  it('should distribute tests correctly across all shards', function (done) {
    this.timeout(20000)

    const shardResults = []
    let completedShards = 0

    for (let i = 1; i <= 4; i++) {
      exec(`${codecept_run} run --config ${configFile} --shard ${i}/4`, (err, stdout, stderr) => {
        expect(err).to.be.null
        expect(stdout).to.contain('OK')
        expect(stdout).to.match(/1 passed/)

        shardResults.push(i)
        completedShards++

        if (completedShards === 4) {
          expect(shardResults).to.have.lengthOf(4)
          done()
        }
      })
    }
  })
})
