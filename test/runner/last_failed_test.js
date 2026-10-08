import { expect } from 'expect'
import path from 'path'
import fs from 'fs'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const runner = path.join(__dirname, '/../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/last-failed')
const config = `--config ${codecept_dir}/codecept.conf.js`
const outputDir = path.join(codecept_dir, 'output')
const resultFile = path.join(outputDir, 'result.json')

const hooks_dir = path.join(__dirname, '/../data/sandbox/configs/last-failed-hooks')
const hooksConfig = `--config ${hooks_dir}/codecept.conf.js`
const hooksResultFile = path.join(hooks_dir, 'output', 'result.json')

const run = (command, env = {}) =>
  new Promise(resolve => {
    exec(`${runner} ${command} ${config}`, { env: { ...process.env, LAST_FAILED_FIXED: '', ...env } }, (err, stdout) => {
      resolve({ code: err ? err.code : 0, stdout })
    })
  })

const runHooks = (command, env = {}) =>
  new Promise(resolve => {
    exec(`${runner} ${command} ${hooksConfig}`, { env: { ...process.env, LAST_FAILED_HOOKS_OK: '', ...env } }, (err, stdout) => {
      resolve({ code: err ? err.code : 0, stdout })
    })
  })

const reportedTests = () => {
  const { tests } = JSON.parse(fs.readFileSync(resultFile, 'utf8'))
  return Object.fromEntries(tests.map(test => [test.title, test.state]))
}

const executedTests = stdout =>
  stdout
    .split('\n')
    .filter(line => line.startsWith('executed: '))
    .map(line => line.replace('executed: ', '').trim())
    .sort()

describe('--last-failed', function () {
  this.timeout(60000)

  beforeEach(() => {
    fs.rmSync(outputDir, { recursive: true, force: true })
    fs.rmSync(path.join(hooks_dir, 'output'), { recursive: true, force: true })
  })

  it('should save a report with test states after a run', async () => {
    const { code } = await run('run')
    expect(code).toEqual(1)
    expect(reportedTests()).toEqual({
      'adds numbers': 'passed',
      'divides numbers @smoke': 'failed',
      'multiplies numbers': 'failed',
      'concats strings': 'passed',
      'uppercases strings @smoke': 'failed',
    })
  })

  it('should rerun only failed tests', async () => {
    await run('run')
    const { code, stdout } = await run('run --last-failed')
    expect(code).toEqual(1)
    expect(executedTests(stdout)).toEqual(['divides numbers', 'multiplies numbers', 'uppercases strings'])
    expect(stdout).toContain('0 passed, 3 failed')
  })

  it('should drop fixed tests from the next --last-failed run', async () => {
    await run('run')
    const fixedRun = await run('run --last-failed', { LAST_FAILED_FIXED: '1' })
    expect(fixedRun.stdout).toContain('1 passed, 2 failed')
    expect(reportedTests()).toEqual({
      'divides numbers @smoke': 'failed',
      'multiplies numbers': 'passed',
      'uppercases strings @smoke': 'failed',
    })

    const { stdout } = await run('run --last-failed')
    expect(executedTests(stdout)).toEqual(['divides numbers', 'uppercases strings'])
  })

  it('should run intersection with --grep', async () => {
    await run('run')
    const { stdout } = await run('run --last-failed --grep "@smoke"')
    expect(executedTests(stdout)).toEqual(['divides numbers', 'uppercases strings'])
    expect(stdout).toContain('0 passed, 2 failed')
  })

  it('should rerun only failed tests in workers', async () => {
    const fullRun = await run('run-workers 2')
    expect(fullRun.stdout).toContain('2 passed, 3 failed')
    expect(reportedTests()).toMatchObject({
      'adds numbers': 'passed',
      'divides numbers @smoke': 'failed',
      'multiplies numbers': 'failed',
      'concats strings': 'passed',
      'uppercases strings @smoke': 'failed',
    })

    const { code, stdout } = await run('run-workers 2 --last-failed')
    expect(code).toEqual(1)
    expect(stdout).toContain('Worker 1: 2 tests')
    expect(stdout).toContain('Worker 2: 1 test')
    expect(stdout).toContain('0 passed, 3 failed')
    expect(stdout).not.toContain('adds numbers')
    expect(stdout).not.toContain('concats strings')
  })

  it('should run intersection with --grep in workers by suite', async () => {
    await run('run')
    const { stdout } = await run('run-workers 2 --by suite --last-failed --grep "@smoke"')
    expect(stdout).toContain('0 passed, 2 failed')
    expect(stdout).not.toContain('multiplies numbers')
  })

  it('should rerun only failed tests in workers by pool', async () => {
    await run('run')
    const { stdout } = await run('run-workers 2 --by pool --last-failed')
    expect(stdout).toContain('0 passed, 3 failed')
    expect(reportedTests()).toEqual({
      'divides numbers @smoke': 'failed',
      'multiplies numbers': 'failed',
      'uppercases strings @smoke': 'failed',
    })
  })

  it('should fail when there is no previous run', async () => {
    for (const command of ['run --last-failed', 'run-workers 2 --last-failed']) {
      const { code, stdout } = await run(command)
      expect(code).toEqual(1)
      expect(stdout).toContain('No previous run found')
      expect(stdout).toContain('run tests once first')
    }
  })

  it('should run nothing when the last run had no failures', async () => {
    await run('run --grep "adds numbers"')
    for (const command of ['run --last-failed', 'run-workers 2 --last-failed']) {
      const { code, stdout } = await run(command)
      expect(code).toEqual(0)
      expect(stdout).toContain('No failed tests in the last run')
      expect(stdout).not.toContain('executed:')
      expect(stdout).not.toContain('passed')
    }
  })

  it('should not wipe result.json when a run executes no tests', async () => {
    await run('run')
    expect(reportedTests()['multiplies numbers']).toEqual('failed')

    const { stdout } = await run('run --grep "no such test"')
    expect(executedTests(stdout)).toEqual([])

    expect(reportedTests()['multiplies numbers']).toEqual('failed')
    const { stdout: rerun } = await run('run --last-failed')
    expect(executedTests(rerun)).toEqual(['divides numbers', 'multiplies numbers', 'uppercases strings'])
  })

  it('should not wipe result.json in workers when a run executes no tests', async () => {
    await run('run-workers 2')
    expect(reportedTests()['multiplies numbers']).toEqual('failed')

    const { stdout } = await run('run-workers 2 --grep "no such test"')
    expect(executedTests(stdout)).toEqual([])

    expect(reportedTests()['multiplies numbers']).toEqual('failed')
  })

  it('should rerun tests of a suite with a failed BeforeSuite', async () => {
    const { code } = await runHooks('run')
    expect(code).toEqual(1)
    const { tests } = JSON.parse(fs.readFileSync(hooksResultFile, 'utf8'))
    expect(Object.fromEntries(tests.map(test => [test.title, test.state]))).toEqual({
      'prepares data': 'failed',
      'serves requests @smoke': 'failed',
    })

    const { stdout } = await runHooks('run --last-failed', { LAST_FAILED_HOOKS_OK: '1' })
    expect(executedTests(stdout)).toEqual(['prepares data', 'serves requests'])
  })

  it('should rerun tests of a suite with a failed BeforeSuite in workers', async () => {
    await runHooks('run-workers 2')
    const { tests } = JSON.parse(fs.readFileSync(hooksResultFile, 'utf8'))
    expect(Object.fromEntries(tests.map(test => [test.title, test.state]))).toEqual({
      'prepares data': 'failed',
      'serves requests @smoke': 'failed',
    })

    const { stdout } = await runHooks('run-workers 2 --last-failed', { LAST_FAILED_HOOKS_OK: '1' })
    expect(executedTests(stdout)).toEqual(['prepares data', 'serves requests'])
  })
})
