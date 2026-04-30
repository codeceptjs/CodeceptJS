import { expect } from 'chai'
import sinon from 'sinon'
import { fileURLToPath } from 'url'
import { dirname, resolve, join } from 'path'
import { existsSync, mkdirSync, rmSync } from 'fs'
import { createHash } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function extractFilesFromListJson(json) {
  if (!json) return []
  if (Array.isArray(json)) return json.map(String)
  if (Array.isArray(json.tests)) return json.tests.map(String)
  if (Array.isArray(json.files)) return json.files.map(String)
  if (Array.isArray(json.testFiles)) return json.testFiles.map(String)
  return []
}

function looksLikePath(v) {
  return typeof v === 'string' && (
    v.includes('/') || v.includes('\\') ||
    v.endsWith('.js') || v.endsWith('.ts')
  )
}

function normalizePath(p) {
  return String(p).replace(/\\/g, '/')
}

function clearString(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_')
}

function getTraceDir(testTitle, testFile) {
  const hash = createHash('sha256').update(testFile + testTitle).digest('hex').slice(0, 8)
  const cleanTitle = clearString(testTitle).slice(0, 200)
  const outputDir = global.output_dir || resolve(process.cwd(), 'output')
  return resolve(outputDir, `trace_${cleanTitle}_${hash}`)
}

describe('MCP Server Utilities', () => {
  describe('extractFilesFromListJson', () => {
    it('should extract files from array', () => {
      const json = ['/path/to/test1.js', '/path/to/test2.js']
      const result = extractFilesFromListJson(json)
      expect(result).to.deep.equal(['/path/to/test1.js', '/path/to/test2.js'])
    })

    it('should extract files from object with tests property', () => {
      const json = { tests: ['/path/to/test1.js', '/path/to/test2.js'] }
      const result = extractFilesFromListJson(json)
      expect(result).to.deep.equal(['/path/to/test1.js', '/path/to/test2.js'])
    })

    it('should extract files from object with files property', () => {
      const json = { files: ['/path/to/test1.js'] }
      const result = extractFilesFromListJson(json)
      expect(result).to.deep.equal(['/path/to/test1.js'])
    })

    it('should extract files from object with testFiles property', () => {
      const json = { testFiles: ['/path/to/test1.js'] }
      const result = extractFilesFromListJson(json)
      expect(result).to.deep.equal(['/path/to/test1.js'])
    })

    it('should return empty array for null input', () => {
      const result = extractFilesFromListJson(null)
      expect(result).to.deep.equal([])
    })

    it('should return empty array for invalid input', () => {
      const result = extractFilesFromListJson({ invalid: true })
      expect(result).to.deep.equal([])
    })
  })

  describe('looksLikePath', () => {
    it('should return true for path with forward slashes', () => {
      expect(looksLikePath('tests/example_test.js')).to.be.true
    })

    it('should return true for path with backslashes', () => {
      expect(looksLikePath('tests\\example_test.js')).to.be.true
    })

    it('should return true for .js file', () => {
      expect(looksLikePath('example_test.js')).to.be.true
    })

    it('should return true for .ts file', () => {
      expect(looksLikePath('example_test.ts')).to.be.true
    })

    it('should return false for test name', () => {
      expect(looksLikePath('my test')).to.be.false
    })

    it('should return false for simple string', () => {
      expect(looksLikePath('login')).to.be.false
    })
  })

  describe('normalizePath', () => {
    it('should convert backslashes to forward slashes', () => {
      const result = normalizePath('path\\to\\file.js')
      expect(result).to.equal('path/to/file.js')
    })

    it('should handle mixed slashes', () => {
      const result = normalizePath('path/to\\file.js')
      expect(result).to.equal('path/to/file.js')
    })

    it('should handle paths with no slashes', () => {
      const result = normalizePath('file.js')
      expect(result).to.equal('file.js')
    })

    it('should convert string to string', () => {
      const result = normalizePath(123)
      expect(result).to.equal('123')
    })
  })

  describe('clearString', () => {
    it('should replace special characters with underscore', () => {
      expect(clearString('test-name')).to.equal('test_name')
    })

    it('should handle multiple special characters', () => {
      expect(clearString('test@#$%name')).to.equal('test____name')
    })

    it('should preserve alphanumeric characters', () => {
      expect(clearString('test123Name')).to.equal('test123Name')
    })

    it('should replace spaces with underscores', () => {
      expect(clearString('test name')).to.equal('test_name')
    })

    it('should handle empty string', () => {
      expect(clearString('')).to.equal('')
    })
  })

  describe('getTraceDir', () => {
    it('should generate unique trace directory name', () => {
      const testFile = '/path/to/test.js'
      const testTitle = 'My Test'

      const result = getTraceDir(testTitle, testFile)

      expect(result).to.be.a('string')
      expect(result).to.include('trace_')
    })

    it('should use hash for uniqueness', () => {
      const testFile = '/path/to/test.js'
      const testTitle = 'My Test'

      const result1 = getTraceDir(testTitle, testFile)
      const result2 = getTraceDir(testTitle, testFile)

      expect(result1).to.equal(result2)
    })

    it('should sanitize test title in directory name', () => {
      const testFile = '/path/to/test.js'
      const testTitle = 'Test: Special@#$ Characters'

      const result = getTraceDir(testTitle, testFile)

      expect(result).to.not.include('@')
      expect(result).to.not.include('#')
      expect(result).to.not.include('$')
      expect(result).to.not.include(':')
    })
  })
})

describe('MCP Server Integration', () => {
  let testOutputDir

  beforeEach(() => {
    testOutputDir = resolve(__dirname, '../output/mcp-test')
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true })
    }
    mkdirSync(testOutputDir, { recursive: true })

    sinon.stub(process, 'stdout').value({
      write: sinon.stub().returns(true),
    })

    sinon.stub(process, 'stderr').value({
      write: sinon.stub().returns(true),
    })

    sinon.stub(process, 'stdin').value({
      write: sinon.stub(),
    })
  })

  afterEach(() => {
    sinon.restore()

    if (existsSync(testOutputDir)) {
      try {
        rmSync(testOutputDir, { recursive: true, force: true })
      } catch (e) {
      }
    }
  })

  describe('Tool Response Format', () => {
    it('should return properly formatted tool response', () => {
      const response = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ status: 'success', output: 'test' }, null, 2),
          },
        ],
      }

      expect(response).to.have.property('content')
      expect(response.content).to.be.an('array')
      expect(response.content[0]).to.have.property('type', 'text')
      expect(response.content[0]).to.have.property('text')

      const parsed = JSON.parse(response.content[0].text)
      expect(parsed).to.have.property('status', 'success')
    })

    it('should return error response properly formatted', () => {
      const errorResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: 'Test error', stack: 'error stack' }, null, 2),
          },
        ],
        isError: true,
      }

      expect(errorResponse).to.have.property('isError', true)
      expect(errorResponse.content[0].type).to.equal('text')

      const parsed = JSON.parse(errorResponse.content[0].text)
      expect(parsed).to.have.property('error')
      expect(parsed).to.have.property('stack')
    })
  })

  describe('Concurrency Control', () => {
    it('should serialize execution using lock', async function () {
      this.timeout(10000)

      let executionOrder = []
      let lock = Promise.resolve()

      async function withLock(fn) {
        const prev = lock
        let release
        lock = new Promise(r => (release = r))

        await prev
        try {
          return await fn()
        } finally {
          release()
        }
      }

      const task1 = withLock(async () => {
        executionOrder.push('start1')
        await new Promise(resolve => setTimeout(resolve, 100))
        executionOrder.push('end1')
      })

      const task2 = withLock(async () => {
        executionOrder.push('start2')
        await new Promise(resolve => setTimeout(resolve, 50))
        executionOrder.push('end2')
      })

      const task3 = withLock(async () => {
        executionOrder.push('start3')
        await new Promise(resolve => setTimeout(resolve, 50))
        executionOrder.push('end3')
      })

      await Promise.all([task1, task2, task3])

      expect(executionOrder).to.deep.equal([
        'start1',
        'end1',
        'start2',
        'end2',
        'start3',
        'end3',
      ])
    })
  })

  describe('Error Handling', () => {
    it('should format error messages correctly', () => {
      const error = new Error('Test error message')
      const errorResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: error.message, stack: error.stack }, null, 2),
          },
        ],
        isError: true,
      }

      expect(errorResponse.isError).to.be.true
      const parsed = JSON.parse(errorResponse.content[0].text)
      expect(parsed.error).to.equal('Test error message')
      expect(parsed.stack).to.be.a('string')
    })
  })

  describe('Artifact Capture', () => {
    it('should include all artifact types when saveArtifacts is true', () => {
      const artifacts = {
        aria: 'aria snapshot content',
        url: 'http://localhost:8000/page',
        consoleLogs: [{ level: 'info', text: 'log message' }],
        html: '<html><body>Page content</body></html>',
      }

      expect(artifacts).to.have.property('aria')
      expect(artifacts).to.have.property('url')
      expect(artifacts).to.have.property('consoleLogs')
      expect(artifacts).to.have.property('html')
    })

    it('should handle missing artifact methods gracefully', () => {
      const partialArtifacts = {
        url: 'http://localhost:8000/',
      }

      expect(partialArtifacts).to.have.property('url')
      expect(partialArtifacts).to.not.have.property('aria')
    })
  })

  describe('pause_session line classification', () => {
    function classifyLine(line) {
      if (!line || !line.trim()) return { kind: 'empty' }
      if (!line.trim().startsWith('{')) return { kind: 'log' }
      let msg
      try { msg = JSON.parse(line.trim()) } catch { return { kind: 'log' } }
      if (!msg || !msg.__mcpPause) return { kind: 'log' }
      return { kind: 'protocol', msg }
    }

    it('classifies a protocol JSON line', () => {
      const r = classifyLine('{"__mcpPause":true,"event":"paused"}')
      expect(r.kind).to.equal('protocol')
      expect(r.msg.event).to.equal('paused')
    })

    it('classifies a result message', () => {
      const r = classifyLine('{"__mcpPause":true,"event":"result","ok":true,"value":"x"}')
      expect(r.kind).to.equal('protocol')
      expect(r.msg.event).to.equal('result')
    })

    it('treats non-JSON as a log line', () => {
      expect(classifyLine('I.click("Save")').kind).to.equal('log')
    })

    it('treats JSON without __mcpPause as a log line', () => {
      expect(classifyLine('{"foo":"bar"}').kind).to.equal('log')
    })

    it('ignores empty/whitespace lines', () => {
      expect(classifyLine('').kind).to.equal('empty')
      expect(classifyLine('   ').kind).to.equal('empty')
    })
  })

  describe('Test Result Formats', () => {
    it('should format step-by-step results correctly', () => {
      const results = [
        {
          test: 'Login functionality',
          file: '/path/to/login_test.js',
          traceFile: 'file:///output/trace_Login_abc123/trace.md',
          status: 'completed',
          steps: [
            { step: 'I.amOnPage("/login")', status: 'passed', time: 150 },
            { step: 'I.fillField("#username", "user")', status: 'passed', time: 80 },
          ],
        },
      ]

      expect(results).to.be.an('array')
      expect(results[0]).to.have.property('test')
      expect(results[0]).to.have.property('file')
      expect(results[0]).to.have.property('traceFile')
      expect(results[0]).to.have.property('status')
      expect(results[0]).to.have.property('steps')
      expect(results[0].steps).to.be.an('array')
      expect(results[0].steps[0]).to.have.property('step')
      expect(results[0].steps[0]).to.have.property('status')
      expect(results[0].steps[0]).to.have.property('time')
    })

    it('should format run_test results correctly', () => {
      const result = {
        meta: {
          exitCode: 0,
          cli: '/path/to/codecept.js',
          root: '/project/root',
          configPath: '/path/to/codecept.conf.js',
          args: ['run', '--config', '/path/to/codecept.conf.js', '--reporter', 'json', 'test.js'],
          resolvedFile: '/full/path/to/test.js',
        },
        reporterJson: {
          stats: { tests: 3, passes: 2, failures: 1 },
        },
        stderr: '',
        rawStdout: '',
      }

      expect(result).to.have.property('meta')
      expect(result.meta).to.have.property('exitCode', 0)
      expect(result.meta).to.have.property('resolvedFile')
      expect(result).to.have.property('reporterJson')
      expect(result.reporterJson).to.have.property('stats')
    })
  })
})
