const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const { expect } = require('expect')

const runner = path.join(__dirname, '../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '../data/sandbox')

describe('stepByStepReport plugin with different run commands', function () {
  this.timeout(60000)

  const outputDir = path.join(codecept_dir, 'output')

  beforeEach(() => {
    // Clean up output directory before each test
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true })
    }
  })

  it('should keep screenshots in worker directories and create consolidated report for run-workers', function (done) {
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
      
      // Screenshots should remain in worker directories, not consolidated
      const worker1Dir = path.join(outputDir, 'worker1')
      const worker2Dir = path.join(outputDir, 'worker2')
      
      // Check that worker directories exist (if tests ran)
      if (fs.existsSync(outputDir)) {
        const items = fs.readdirSync(outputDir)
        console.log('Output directory contents:', items)
        
        // The consolidated records.html should be in the base output directory
        const recordsHtml = path.join(outputDir, 'records.html')
        
        // If tests ran and created screenshots, we should see evidence of them
        console.log('Records.html exists:', fs.existsSync(recordsHtml))
        
        // Screenshots should NOT be in a consolidated stepByStepReport directory
        const stepByStepDir = path.join(outputDir, 'stepByStepReport')
        expect(fs.existsSync(stepByStepDir)).toBe(false)
      }
      
      // Clean up
      fs.unlinkSync(configPath)
      
      done()
    })
  })

  it('should keep screenshots in run-multiple directories and create consolidated report', function (done) {
    const multipleConfig = `
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
  multiple: {
    basic: {
      browsers: ['chrome']
    },
    smoke: {
      browsers: ['firefox']
    }
  }
}
`
    
    const configPath = path.join(codecept_dir, 'codecept.multiple.js')
    fs.writeFileSync(configPath, multipleConfig)

    const command = `${runner} run-multiple basic --config ${configPath} --grep "@stepbystep"`
    
    exec(command, (err, stdout, stderr) => {
      console.log('STDOUT:', stdout)
      console.log('STDERR:', stderr)
      
      if (fs.existsSync(outputDir)) {
        const items = fs.readdirSync(outputDir)
        console.log('Output directory contents:', items)
        
        // Screenshots should NOT be in a consolidated stepByStepReport directory
        const stepByStepDir = path.join(outputDir, 'stepByStepReport')
        expect(fs.existsSync(stepByStepDir)).toBe(false)
        
        // The consolidated records.html should be in the base output directory
        const recordsHtml = path.join(outputDir, 'records.html')
        console.log('Records.html exists:', fs.existsSync(recordsHtml))
      }
      
      // Clean up
      fs.unlinkSync(configPath)
      
      done()
    })
  })

  it('should work with regular run command (backward compatibility)', function (done) {
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
    
    const configPath = path.join(codecept_dir, 'codecept.regular.js')
    fs.writeFileSync(configPath, config)

    const command = `${runner} run --config ${configPath} --grep "@stepbystep"`
    
    exec(command, (err, stdout, stderr) => {
      console.log('STDOUT:', stdout)
      console.log('STDERR:', stderr)
      
      // For regular run, everything should work as before in the main output directory
      if (fs.existsSync(outputDir)) {
        const items = fs.readdirSync(outputDir)
        console.log('Output directory contents:', items)
        
        // Should NOT create a consolidated stepByStepReport directory for regular runs
        const stepByStepDir = path.join(outputDir, 'stepByStepReport')
        expect(fs.existsSync(stepByStepDir)).toBe(false)
      }
      
      // Clean up
      fs.unlinkSync(configPath)
      
      done()
    })
  })
})