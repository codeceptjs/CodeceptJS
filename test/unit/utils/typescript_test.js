import { expect } from 'chai'
import { fileURLToPath } from 'url'
import path from 'path'
import { createRequire } from 'module'
import { transpileTypeScript, cleanupTempFiles } from '../../../lib/utils/typescript.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const typescript = require('typescript')

const configPath = path.resolve(__dirname, '../../data/typescript-config-imports/tests/api/codecept.conf.ts')
const dynamicImportDir = path.resolve(__dirname, '../../data/typescript-config-dynamic-import')
const dynamicImportConfigPath = path.join(dynamicImportDir, 'codecept.conf.ts')
const entrypointModulePath = path.join(dynamicImportDir, 'lifecycle/teardown.ts')

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

  it('transpiles and rewrites modules reached through a dynamic import()', async () => {
    const result = await transpileTypeScript(dynamicImportConfigPath, typescript)

    try {
      // config + the dynamically imported module + that module's own static import
      expect(result.allTempFiles.length).to.equal(3)

      const configModule = await import(result.tempFile)
      expect(await configModule.runTeardown()).to.equal('teardown:swept')
    } finally {
      cleanupTempFiles(result.allTempFiles)
    }
  })

  it('shims a bare `require.main === module` entrypoint guard without running it', async () => {
    const result = await transpileTypeScript(entrypointModulePath, typescript)
    const logged = []
    const originalLog = console.log
    console.log = (...args) => logged.push(args.join(' '))

    try {
      // Importing must not throw "require is not defined in ES module scope" ...
      const transpiled = await import(result.tempFile)
      expect(transpiled.teardown()).to.equal('teardown:swept')
      // ... and the guarded block must stay dormant, since the module was imported, not run.
      expect(logged, `entrypoint block executed on import: ${logged}`).to.be.empty
    } finally {
      console.log = originalLog
      cleanupTempFiles(result.allTempFiles)
    }
  })
})
