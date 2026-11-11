import { expect } from 'chai'
import path from 'path'
import { fileURLToPath } from 'url'
import { globSync } from 'glob'
import { resolvePatterns } from '../../../lib/command/run-multiple.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const testRoot = path.join(__dirname, '../../data/sandbox')

describe('run-multiple command', () => {
  describe('resolvePatterns', () => {
    it('should resolve a pattern that glob can match', () => {
      const pattern = resolvePatterns(testRoot, './features/*.feature')
      expect(path.isAbsolute(pattern)).to.be.true
      expect(globSync(pattern)).to.have.lengthOf(globSync('./features/*.feature', { cwd: testRoot }).length).and.not.be.empty
    })

    it('should resolve each pattern of an array', () => {
      const patterns = resolvePatterns(testRoot, ['./features/checkout.feature', './features/async.feature'])
      expect(patterns).to.have.lengthOf(2)
      patterns.forEach(pattern => expect(globSync(pattern)).to.have.lengthOf(1))
    })
  })
})
