import { expect } from 'chai'
import { fileURLToPath, pathToFileURL } from 'url'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { createRequire } from 'module'
import { transpileTypeScript, mapTranspiledStackFrame, cleanupTempFiles } from '../../../lib/utils/typescript.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const typescript = require('typescript')

const configPath = path.resolve(__dirname, '../../data/typescript-config-imports/tests/api/codecept.conf.ts')

describe('TypeScript transpilation', () => {
  it('uses unique temp file names per invocation so concurrent run-multiple workers do not delete each other (#5642)', async () => {
    const first = await transpileTypeScript(configPath, typescript)
    const second = await transpileTypeScript(configPath, typescript)

    try {
      expect(first.allTempFiles.length).to.be.greaterThan(0)
      expect(second.allTempFiles.length).to.equal(first.allTempFiles.length)

      // Every temp file path is still recognisable as a transpiled file
      for (const file of [...first.allTempFiles, ...second.allTempFiles]) {
        expect(file).to.match(/\.temp\.mjs$/)
      }

      // The two invocations must not share any temp file path, otherwise one
      // worker's cleanup would remove files the other still needs to import.
      const shared = first.allTempFiles.filter(f => second.allTempFiles.includes(f))
      expect(shared, `temp files were shared between invocations: ${shared}`).to.be.empty
    } finally {
      cleanupTempFiles(first.allTempFiles)
      cleanupTempFiles(second.allTempFiles)
    }
  })

  it('maps transpiled stack frames back to the original .ts positions (#5772)', async () => {
    const pageObject = path.resolve(__dirname, '../../data/sandbox/typescript-step-paths/pages/fooPage.ts')
    const { tempFile, allTempFiles } = await transpileTypeScript(pageObject, typescript)

    try {
      // I.doThing('from page') is on line 7 of fooPage.ts; the transpiled
      // .temp.mjs reports it at 4:11
      const frame = `at Object.open (${tempFile}:4:11)`
      expect(mapTranspiledStackFrame(frame)).to.equal(`at Object.open (${pageObject}:7:7)`)
    } finally {
      cleanupTempFiles(allTempFiles)
    }
  })

  it('accounts for injected CommonJS shims when mapping positions', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codecept-ts-'))
    const tsFile = path.join(tmpDir, 'shimmed.ts')
    fs.writeFileSync(tsFile, 'const path = require("path");\nexport default {\n  open() {\n    const p = path.join("a", "b");\n    return p;\n  },\n};\n')

    const { tempFile, allTempFiles } = await transpileTypeScript(tsFile, typescript)
    try {
      const tempPath = fileURLToPath(tempFile)
      const tempLines = fs.readFileSync(tempPath, 'utf8').split('\n')
      const tempLine = tempLines.findIndex(l => l.includes('path.join')) + 1
      expect(tempLine).to.be.greaterThan(4) // shim injection shifted lines down

      const frame = `at Object.open (${tempFile}:${tempLine}:15)`
      const mapped = mapTranspiledStackFrame(frame)
      expect(mapped).to.match(/\(.*shimmed\.ts:4:\d+\)/)
    } finally {
      cleanupTempFiles(allTempFiles)
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('returns null for frames that cannot be mapped', () => {
    expect(mapTranspiledStackFrame('at Object.open (/some/file.js:1:1)')).to.be.null
    expect(mapTranspiledStackFrame('at Object.open (file:///does/not/exist.123.temp.mjs:1:1)')).to.be.null
  })
})
