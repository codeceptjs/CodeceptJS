import { expect } from 'chai'
import Codecept from '../../lib/codecept.js'
import Container from '../../lib/container.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe('Test Files Alphabetical Order', () => {
  let codecept
  const tempDir = path.join(__dirname, '../data/sandbox/configs/alphabetical_order')
  const config = {
    tests: `${tempDir}/*_test.js`,
    gherkin: { features: null },
    output: './output',
    hooks: [],
  }

  before(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    fs.writeFileSync(
      path.join(tempDir, 'zzz_test.js'),
      `
        Feature('Test');
        Scenario('zzz test', () => {});
      `,
    )
    fs.writeFileSync(
      path.join(tempDir, 'aaa_test.js'),
      `
        Feature('Test');
        Scenario('aaa test', () => {});
      `,
    )
    fs.writeFileSync(
      path.join(tempDir, 'mmm_test.js'),
      `
        Feature('Test');
        Scenario('mmm test', () => {});
      `,
    )
  })

  after(() => {
    const files = ['zzz_test.js', 'aaa_test.js', 'mmm_test.js']
    files.forEach(file => {
      const filePath = path.join(tempDir, file)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    })
  })

  beforeEach(async () => {
    codecept = new Codecept(config, {})
    await codecept.init(path.join(__dirname, '../data/sandbox'))
  })

  afterEach(() => {
    Container.clear()
  })

  it('should sort test files alphabetically when run() is called', async () => {
    codecept.loadTests()

    if (codecept.testFiles.length === 0) {
      console.log('No test files found, skipping test')
      return
    }

    // Capture the files that would be passed to mocha during run()
    let filesPassedToMocha = null
    const mocha = Container.mocha()
    mocha.run = callback => {
      filesPassedToMocha = [...mocha.files]
      // Call callback immediately to complete the run
      if (callback) callback()
    }

    // Call run() which should sort files before passing to mocha
    await codecept.run()

    // Verify files passed to mocha are sorted alphabetically
    expect(filesPassedToMocha).to.not.be.null
    const filenames = filesPassedToMocha.map(filePath => path.basename(filePath))
    const sortedFilenames = [...filenames].sort()

    expect(filenames).to.deep.equal(sortedFilenames, 'Files should be sorted alphabetically for execution')

    const aaaIndex = filenames.findIndex(f => f.includes('aaa_test.js'))
    const mmmIndex = filenames.findIndex(f => f.includes('mmm_test.js'))
    const zzzIndex = filenames.findIndex(f => f.includes('zzz_test.js'))

    expect(aaaIndex).to.be.greaterThan(-1)
    expect(mmmIndex).to.be.greaterThan(-1)
    expect(zzzIndex).to.be.greaterThan(-1)

    expect(aaaIndex).to.be.lessThan(mmmIndex, 'aaa_test.js should come before mmm_test.js')
    expect(mmmIndex).to.be.lessThan(zzzIndex, 'mmm_test.js should come before zzz_test.js')
  })
})
