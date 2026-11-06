import { execFile } from 'child_process'
import { expect } from 'expect'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const runner = path.join(__dirname, '../../bin/codecept.js')
const codeceptDir = path.join(__dirname, '../data/sandbox/typescript-step-paths')

describe('TypeScript step paths', () => {
  for (const configFile of ['codecept.conf.js', 'codecept.esm.conf.js']) {
    it(`maps included page object steps back to their source file with ${configFile}`, done => {
      execFile(
        process.execPath,
        [runner, 'run', '--config', path.join(codeceptDir, configFile)],
        { cwd: codeceptDir, env: { ...process.env, FORCE_COLOR: '0' } },
        (err, stdout) => {
          try {
            expect(err).toBeTruthy()
            expect(stdout).toContain('Scenario Steps:')
            expect(stdout).toMatch(/at Object\.open \(\.\/pages\/fooPage\.ts:\d+:\d+\)/)
            // #5772: line/column must come from the .ts source, not the transpiled .temp.mjs
            // (I.doThing is on line 7 of pages/fooPage.ts)
            expect(stdout).toMatch(/at Object\.open \(\.\/pages\/fooPage\.ts:7:7\)/)
            expect(stdout).not.toContain('.temp.mjs')
            expect(stdout).not.toContain('file://./pages/fooPage.ts')
            done()
          } catch (error) {
            done(error)
          }
        },
      )
    })
  }
})
