import { expect } from 'chai'
import { fileURLToPath } from 'url'
import path from 'path'
import { createRequire } from 'module'
import { transpileTypeScript, cleanupTempFiles } from '../../../lib/utils/typescript.js'

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
})
