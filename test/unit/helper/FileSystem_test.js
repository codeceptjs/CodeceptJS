import path from 'path'
import { expect } from 'chai'
import { fileURLToPath } from 'url'
import nodeFs from 'fs'
import FileSystem from '../../../lib/helper/FileSystem.js'
import codeceptjs from '../../../lib/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

global.codeceptjs = codeceptjs

let fs

describe('FileSystem', () => {
  before(() => {
    // 1. Point directly to the sandbox directory
    // (Adjust the '../../' depending on how deep this test file is nested so it points to CodeceptJS/test/data/sandbox)
    const sandboxDir = path.resolve(__dirname, '../../data/sandbox')

    // 2. Align the global directory with the CI's expected sandbox
    global.codecept_dir = sandboxDir

    // 3. Define paths inside the sandbox
    const dataDir = path.join(sandboxDir, 'data')
    const outputDir = path.join(dataDir, 'output')
    const sampleFilePath = path.join(dataDir, 'fs_sample.txt')

    // 4. Guarantee the sandbox directories exist
    if (!nodeFs.existsSync(dataDir)) {
      nodeFs.mkdirSync(dataDir, { recursive: true })
    }
    if (!nodeFs.existsSync(outputDir)) {
      nodeFs.mkdirSync(outputDir, { recursive: true })
    }

    // 5. Guarantee the mock file exists inside the sandbox
    const sampleContent = `A simple file\nfor FileSystem helper\ntest`
    nodeFs.writeFileSync(sampleFilePath, sampleContent)
  })

  beforeEach(() => {
    fs = new FileSystem()
    fs._before()
  })

  it('should be initialized before tests', () => {
    // This will now pass, because both fs.dir and global.codecept_dir are the sandbox
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
