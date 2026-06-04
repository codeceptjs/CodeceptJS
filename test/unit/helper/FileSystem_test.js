import path from 'path'
import { expect } from 'chai'
import { fileURLToPath } from 'url'
import nodeFs from 'fs' // Import native Node file system
import FileSystem from '../../../lib/helper/FileSystem.js'
import codeceptjs from '../../../lib/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

global.codeceptjs = codeceptjs

let fs

describe('FileSystem', () => {
  before(() => {
    global.codecept_dir = path.join(__dirname, '../..')

    // 1. Define exact paths
    const dataDir = path.join(global.codecept_dir, 'data')
    const outputDir = path.join(dataDir, 'output')
    const sampleFilePath = path.join(dataDir, 'fs_sample.txt')

    // 2. Guarantee the directories exist (this fixes the CI crash!)
    if (!nodeFs.existsSync(dataDir)) {
      nodeFs.mkdirSync(dataDir, { recursive: true })
    }
    if (!nodeFs.existsSync(outputDir)) {
      nodeFs.mkdirSync(outputDir, { recursive: true })
    }

    // 3. Guarantee the mock file exists with the exact string expected
    const sampleContent = `A simple file\nfor FileSystem helper\ntest`
    nodeFs.writeFileSync(sampleFilePath, sampleContent)
  })

  beforeEach(() => {
    fs = new FileSystem()
    fs._before()
  })

  it('should be initialized before tests', () => {
    expect(fs.dir).to.eql(global.codecept_dir)
  })

  it('should open dirs', () => {
    fs.amInPath('data')
    expect(fs.dir).to.eql(path.join(global.codecept_dir, '/data'))
  })

  it('should see file', () => {
    fs.seeFile('data/fs_sample.txt')
    fs.amInPath('data')
    fs.seeFile('fs_sample.txt')
    expect(fs.grabFileNames()).to.include('fs_sample.txt')
    fs.seeFileNameMatching('sample')
  })

  it('should check file contents', () => {
    fs.seeFile('data/fs_sample.txt')
    fs.seeInThisFile('FileSystem')
    fs.dontSeeInThisFile('WebDriverIO')
    fs.dontSeeFileContentsEqual('123345')

    // Note: If tests fail on Windows due to line endings (\r\n vs \n),
    // the dynamic writeFileSync in the before() hook solves that too!
    fs.seeFileContentsEqual(`A simple file\nfor FileSystem helper\ntest`)
  })

  it('should write text to file', () => {
    const outputFilePath = 'data/output/fs_output.txt'
    const text = '123'
    fs.writeToFile(outputFilePath, text)
    fs.seeFile(outputFilePath)
    fs.seeInThisFile(text)
  })
})
