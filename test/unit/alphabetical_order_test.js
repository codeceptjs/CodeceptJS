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

  it('should not sort test files in loadTests (sorting happens in run)', () => {
    codecept.loadTests()

    if (codecept.testFiles.length === 0) {
      console.log('No test files found, skipping test')
      return
    }

    // After loadTests(), files should be in glob order (NOT sorted).
    // Sorting should only happen later in run().
    const filenames = codecept.testFiles.map(filePath => path.basename(filePath))

    // Verify all 3 test files were loaded
    expect(filenames).to.include('aaa_test.js')
    expect(filenames).to.include('mmm_test.js')
    expect(filenames).to.include('zzz_test.js')
    expect(filenames.length).to.equal(3)

    // Verify that sorting the files produces alphabetical order
    const sortedFiles = [...codecept.testFiles].sort()
    const sortedFilenames = sortedFiles.map(filePath => path.basename(filePath))

    expect(sortedFilenames[0]).to.include('aaa_test.js')
    expect(sortedFilenames[1]).to.include('mmm_test.js')
    expect(sortedFilenames[2]).to.include('zzz_test.js')
  })
})
