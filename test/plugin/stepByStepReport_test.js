const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const { expect } = require('expect')

const runner = path.join(__dirname, '../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '../data/sandbox')

describe('stepByStepReport plugin with different run commands', function () {
  this.timeout(60000)

  const outputDir = path.join(codecept_dir, 'output')
  const stepByStepDir = path.join(outputDir, 'stepByStepReport')

  beforeEach(() => {
    // Clean up output directory before each test
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true })
    }
  })

  it('should create stepByStepReport directory when using run-workers', function (done) {
    const config = `
exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FakeDriver: {
      require: '../fake_driver',
      browser: 'dummy',
    },
  },
  plugins: {
    stepByStepReport: {
      enabled: true,
      deleteSuccessful: false,
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'stepByStepTest',
}
`
    
    const configPath = path.join(codecept_dir, 'codecept.stepbystep.js')
    fs.writeFileSync(configPath, config)

    const command = `${runner} run-workers 2 --config ${configPath} --grep "@stepbystep"`
    
    exec(command, (err, stdout, stderr) => {
      console.log('STDOUT:', stdout)
      console.log('STDERR:', stderr)
      
      // The step by step directory should exist
      const exists = fs.existsSync(stepByStepDir)
      expect(exists).toBe(true)
      
      // Clean up
      fs.unlinkSync(configPath)
      
      done()
    })
  })

  it('should consolidate screenshots from run-multiple', function (done) {
    const config = `
exports.config = {
  tests: './*_test.multiple.js',
  timeout: 10000,
  output: './output',
  helpers: {
    FakeDriver: {
      require: '../fake_driver',
      browser: 'dummy',
    },
  },
  plugins: {
    stepByStepReport: {
      enabled: true,
      deleteSuccessful: false,
    },
  },
  multiple: {
    test1: {
      browsers: ['chrome'],
    },
    test2: {
      browsers: ['firefox'],
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'stepByStepMultipleTest',
}
`
    
    const configPath = path.join(codecept_dir, 'codecept.stepbystep.multiple.js')
    fs.writeFileSync(configPath, config)

    const command = `${runner} run-multiple --config ${configPath} test1`
    
    exec(command, (err, stdout, stderr) => {
      console.log('STDOUT:', stdout)
      console.log('STDERR:', stderr)
      
      // The step by step directory should exist
      const exists = fs.existsSync(stepByStepDir)
      expect(exists).toBe(true)
      
      // Clean up
      fs.unlinkSync(configPath)
      
      done()
    })
  })
})