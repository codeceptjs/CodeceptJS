import * as chai from 'chai'
chai.should()
import assert from 'assert'
import path from 'path'
import fs from 'fs'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const runner = path.join(__dirname, '/../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/gherkin/')

describe('gherkin bdd commands', () => {
  describe('bdd:init', () => {
    const codecept_dir_js = path.join(codecept_dir, 'config_js')
    const codecept_dir_ts = path.join(codecept_dir, 'config_ts')

    beforeEach(() => {
      fs.copyFileSync(path.join(codecept_dir_js, 'codecept.conf.init.js'), path.join(codecept_dir_js, 'codecept.conf.js'))
      fs.copyFileSync(path.join(codecept_dir_ts, 'codecept.conf.init.ts'), path.join(codecept_dir_ts, 'codecept.conf.ts'))
    })

    afterEach(() => {
      try {
        fs.rmSync(path.join(codecept_dir_js, 'codecept.conf.js'))
        fs.rmSync(path.join(codecept_dir_js, 'features'), {
          recursive: true,
        })
        fs.rmSync(path.join(codecept_dir_js, 'step_definitions'), {
          recursive: true,
        })
      } catch (e) {
        // catch some error
      }
      try {
        fs.rmSync(path.join(codecept_dir_ts, 'codecept.conf.ts'))
        fs.rmSync(path.join(codecept_dir_ts, 'features'), {
          recursive: true,
        })
        fs.rmSync(path.join(codecept_dir_ts, 'step_definitions'), {
          recursive: true,
        })
      } catch (e) {
        // catch some error
      }
    })
    ;[
      {
        codecept_dir_test: codecept_dir_js,
        extension: 'js',
      },
      {
        codecept_dir_test: codecept_dir_ts,
        extension: 'ts',
      },
    ].forEach(({ codecept_dir_test, extension }) => {
      it(`prepare CodeceptJS to run feature files (codecept.conf.${extension})`, done => {
        exec(`${runner} gherkin:init ${codecept_dir_test}`, (err, stdout) => {
          let dir = path.join(codecept_dir_test, 'features')
          // Convert to relative path for output comparison
          let relativeDir = path.relative(process.cwd(), dir)

          stdout.should.include('Initializing Gherkin (Cucumber BDD) for CodeceptJS')
          stdout.should.include(`Created ${relativeDir}, place your *.feature files in it`)
          stdout.should.include('Created sample feature file: features/basic.feature')

          dir = path.join(codecept_dir_test, 'step_definitions')
          // Convert to relative path for output comparison
          relativeDir = path.relative(process.cwd(), dir)
          stdout.should.include(`Created ${relativeDir}, place step definitions into it`)
          stdout.should.include(`Created sample steps file: step_definitions/steps.${extension}`)
          assert(!err)

          const configResult = fs.readFileSync(path.join(codecept_dir_test, `codecept.conf.${extension}`)).toString()
          configResult.should.contain("features: './features/*.feature'")
          configResult.should.contain(`steps: ['./step_definitions/steps.${extension}']`)
          done()
        })
      })
    })
  })
})
