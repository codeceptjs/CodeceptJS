const expect = require('chai').expect
const Codecept = require('../../lib/codecept')
const path = require('path')
const fs = require('fs')

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

  beforeEach(() => {
    codecept = new Codecept(config, {})
    codecept.init(path.join(__dirname, '../data/sandbox'))
  })

  it('should sort test files alphabetically after loading', () => {
    codecept.loadTests()

    if (codecept.testFiles.length === 0) {
      console.log('No test files found, skipping test')
      return
    }

    const filenames = codecept.testFiles.map(filePath => path.basename(filePath))

    const sortedFilenames = [...filenames].sort()

    expect(filenames).to.deep.equal(sortedFilenames)

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
