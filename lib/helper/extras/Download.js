import fs from 'fs'
import path from 'path'
import assert from 'assert'
import store from '../../store.js'

class Downloads {
  constructor() {
    this.names = []
    this.saved = []
  }

  get dir() {
    return path.join(store.outputDir, 'downloads')
  }

  pathFor(name) {
    return path.join(this.dir, name)
  }

  reset() {
    this.names = []
    for (const file of this.saved) fs.rmSync(file, { force: true })
    this.saved = []
    if (!store.outputDir) return
    fs.mkdirSync(this.dir, { recursive: true })
  }

  trackSaved(file) {
    this.saved.push(file)
  }

  add(name) {
    this.names.push(name)
  }

  matching(pattern) {
    if (pattern === undefined || pattern === null) return this.names
    if (pattern instanceof RegExp) return this.names.filter(name => pattern.test(name))
    if (pattern.includes('*')) return this.names.filter(name => path.matchesGlob(name, pattern))
    return this.names.filter(name => name === pattern)
  }

  describe(pattern) {
    if (pattern === undefined || pattern === null) return 'any file'
    return `file matching ${pattern}`
  }

  async waitFor(pattern, timeout) {
    const deadline = Date.now() + timeout
    while (this.matching(pattern).length === 0) {
      if (Date.now() >= deadline) {
        throw new assert.AssertionError({
          message: `Expected ${this.describe(pattern)} to be downloaded in ${timeout / 1000} sec. Downloaded: [${this.names.join(', ')}]`,
        })
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  assertNone(pattern) {
    const found = this.matching(pattern)
    assert.ok(found.length === 0, `Expected no ${this.describe(pattern)} to be downloaded, but found: [${found.join(', ')}]`)
  }
}

export default Downloads
