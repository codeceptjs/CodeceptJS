import fs from 'fs'
import path from 'path'
import minimatch from 'minimatch'
import store from '../../store.js'
import assert from 'assert'

function getDownloadDir() {
  return path.join(store.outputDir, 'downloads')
}

function getNewFiles(downloadDir, sinceTimestamp) {
  if (!fs.existsSync(downloadDir)) return []
  return fs.readdirSync(downloadDir).filter(name => {
    const stat = fs.statSync(path.join(downloadDir, name))
    return stat.isFile() && stat.mtimeMs >= sinceTimestamp
  })
}

function seeFileDownloaded(arg) {
  const downloadDir = getDownloadDir()
  const files = getNewFiles(downloadDir, this._downloadStartTimestamp)

  if (arg === undefined || arg === null) {
    assert.ok(files.length > 0, `No files downloaded to ${downloadDir}`)
    return
  }
  if (typeof arg === 'number') {
    assert.strictEqual(files.length, arg, `Expected ${arg} downloaded file(s), found ${files.length}: [${files.join(', ')}]`)
    return
  }
  const regexMatch = arg.match(/^\/(.+)\/$/)
  if (regexMatch) {
    const re = new RegExp(regexMatch[1])
    assert.ok(files.some(f => re.test(f)), `No file matches ${arg}. Downloaded: [${files.join(', ')}]`)
    return
  }
  if (/[*?[\]]/.test(arg)) {
    const matched = minimatch.match(files, arg)
    assert.ok(matched.length > 0, `No file matches glob "${arg}". Downloaded: [${files.join(', ')}]`)
    return
  }
  assert.ok(files.includes(arg), `File "${arg}" not downloaded. Downloaded: [${files.join(', ')}]`)
}

export { seeFileDownloaded, getDownloadDir }
