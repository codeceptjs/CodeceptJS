import path from 'path'
import { fileURLToPath } from 'url'

import path from 'path'

let expect
import('chai').then(chai => {
  expect = chai.expect
})

import FileSystem from '../../../lib/helper/FileSystem.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
global.codecept_dir = path.join(__dirname, '/..')
global.codeceptjs = require('../../../lib')

let fs

describe('FileSystem', () => {
  before(() => {
  })

  beforeEach(() => {
    fs = new FileSystem()
    fs._before()
  })

  it('should be initialized before tests', () => {
  })

  it('should open dirs', () => {
    fs.amInPath('data')
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
    fs.seeFileContentsEqual(`A simple file
for FileSystem helper
test`)
  })

  it('should write text to file', () => {
    const outputFilePath = 'data/output/fs_output.txt'
    const text = '123'
    fs.writeToFile(outputFilePath, text)
    fs.seeFile(outputFilePath)
    fs.seeInThisFile(text)
  })
})
