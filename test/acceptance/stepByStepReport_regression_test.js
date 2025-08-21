const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const { expect } = require('expect')

const runner = path.join(__dirname, '../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '../data/sandbox')

describe('stepByStepReport regression tests', function () {
  this.timeout(120000) // Increased timeout for acceptance tests

  const outputDir = path.join(codecept_dir, 'output')

  beforeEach(() => {
    // Clean up output directory before each test
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true })
    }
  })

  afterEach(() => {
    // Clean up output directory after each test
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true })
    }
  })

  function createConfig(name, extraConfig = {}) {
    const config = `
// Override the standard acting helpers to include FakeDriver for testing
const Container = require('../../lib/container')
const originalHelpers = Container.STANDARD_ACTING_HELPERS
Object.defineProperty(Container, 'STANDARD_ACTING_HELPERS', {
  get: () => [...originalHelpers, 'FakeDriver']
})

exports.config = {
  tests: './stepbystep_test.js',
  timeout: 30000,
  output: './output',
  helpers: {
    FakeDriver: {
      require: '../fake_driver',
      browser: 'dummy',
      windowSize: '1024x768'
    },
  },
  plugins: {
    stepByStepReport: {
      enabled: true,
      deleteSuccessful: false,
      ...${JSON.stringify(extraConfig)}
    },
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: '${name}',
}
`
    const configPath = path.join(codecept_dir, `codecept.${name}.js`)
    fs.writeFileSync(configPath, config)
    return configPath
  }

  function runCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: codecept_dir }, (err, stdout, stderr) => {
        resolve({ err, stdout, stderr })
      })
    })
  }

  it('should handle run-workers without consolidating screenshots', async function () {
    const configPath = createConfig('workers-test')

    const command = `${runner} run-workers 2 --config ${configPath} --grep "@stepbystep"`
    const result = await runCommand(command)

    console.log('STDOUT:', result.stdout)
    console.log('STDERR:', result.stderr)

    // Key regression test: ensure no stepByStepReport consolidation directory
    const consolidatedDir = path.join(outputDir, 'stepByStepReport')
    expect(fs.existsSync(consolidatedDir)).toBe(false)

    console.log('✓ No stepByStepReport consolidation directory created for run-workers')

    // Verify basic functionality without requiring screenshots
    expect(result.stdout).toContain('CodeceptJS')

    // Clean up
    fs.unlinkSync(configPath)
  })

  it('should handle run-multiple without consolidating screenshots', async function () {
    const multipleConfig = `
// Override the standard acting helpers to include FakeDriver for testing
const Container = require('../../lib/container')
const originalHelpers = Container.STANDARD_ACTING_HELPERS
Object.defineProperty(Container, 'STANDARD_ACTING_HELPERS', {
  get: () => [...originalHelpers, 'FakeDriver']
})

exports.config = {
  tests: './stepbystep_test.js',
  timeout: 30000,
  output: './output',
  helpers: {
    FakeDriver: {
      require: '../fake_driver',
      browser: 'dummy',
      windowSize: '1024x768'
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
  name: 'multiple-test',
  multiple: {
    basic: {
      browsers: ['chrome']
    }
  }
}
`

    const configPath = path.join(codecept_dir, 'codecept.multiple.js')
    fs.writeFileSync(configPath, multipleConfig)

    const command = `${runner} run-multiple basic --config ${configPath} --grep "@stepbystep"`
    const result = await runCommand(command)

    console.log('STDOUT:', result.stdout)
    console.log('STDERR:', result.stderr)

    // Key regression test: ensure no stepByStepReport consolidation directory
    const consolidatedDir = path.join(outputDir, 'stepByStepReport')
    expect(fs.existsSync(consolidatedDir)).toBe(false)

    console.log('✓ No stepByStepReport consolidation directory created for run-multiple')

    // Verify that the command runs successfully with run-multiple
    expect(result.stdout).toContain('CodeceptJS')

    // Clean up
    fs.unlinkSync(configPath)
  })

  it('should handle regular run command with backward compatibility', async function () {
    const configPath = createConfig('regular')

    const command = `${runner} run --config ${configPath} --grep "@stepbystep"`
    const result = await runCommand(command)

    console.log('STDOUT:', result.stdout)
    console.log('STDERR:', result.stderr)

    // Key regression test: ensure no stepByStepReport consolidation directory
    const consolidatedDir = path.join(outputDir, 'stepByStepReport')
    expect(fs.existsSync(consolidatedDir)).toBe(false)

    console.log('✓ No stepByStepReport consolidation directory created for regular run')

    // Verify backward compatibility - regular run should work
    expect(result.stdout).toContain('CodeceptJS')

    // Clean up
    fs.unlinkSync(configPath)
  })

  it('should handle custom output directories', async function () {
    const configPath = createConfig('custom-output', { output: './output/custom' })

    const command = `${runner} run-workers 2 --config ${configPath} --grep "@stepbystep"`
    const result = await runCommand(command)

    console.log('STDOUT:', result.stdout)
    console.log('STDERR:', result.stderr)

    // Check that no consolidation happens in any output directory
    const mainConsolidatedDir = path.join(outputDir, 'stepByStepReport')
    const customConsolidatedDir = path.join(outputDir, 'custom', 'stepByStepReport')

    expect(fs.existsSync(mainConsolidatedDir)).toBe(false)
    expect(fs.existsSync(customConsolidatedDir)).toBe(false)

    console.log('✓ No stepByStepReport consolidation directory created with custom output')

    // Clean up
    fs.unlinkSync(configPath)
  })

  it('should not crash with stepByStepReport plugin enabled', async function () {
    // This test ensures the plugin initialization and basic operations work
    // without causing crashes across different execution modes
    const configPath = createConfig('no-crash-test')

    const commands = [`${runner} run --config ${configPath} --grep "@stepbystep"`, `${runner} run-workers 2 --config ${configPath} --grep "@stepbystep"`]

    for (const command of commands) {
      const result = await runCommand(command)

      console.log(`Command: ${command}`)
      console.log('STDOUT:', result.stdout)
      console.log('STDERR:', result.stderr)

      // Ensure the plugin doesn't cause crashes
      expect(result.stdout).toContain('CodeceptJS')
      expect(result.stderr).not.toContain('Cannot read properties of undefined')
      expect(result.stderr).not.toContain('TypeError')

      // Key regression test
      const consolidatedDir = path.join(outputDir, 'stepByStepReport')
      expect(fs.existsSync(consolidatedDir)).toBe(false)
    }

    console.log('✓ Plugin works without crashes across execution modes')

    // Clean up
    fs.unlinkSync(configPath)
  })
})
