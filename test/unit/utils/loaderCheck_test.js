import { expect } from 'chai'
import { checkTypeScriptLoader, validateTypeScriptSetup } from '../../../lib/utils/loaderCheck.js'

describe('TypeScript loader check', () => {
  const hadBun = 'bun' in process.versions
  const originalBun = process.versions.bun

  afterEach(() => {
    if (hadBun) {
      process.versions.bun = originalBun
    } else {
      delete process.versions.bun
    }
  })

  describe('on Node', () => {
    beforeEach(() => {
      delete process.versions.bun
    })

    it('detects a configured loader', () => {
      for (const loader of ['tsx/esm', 'tsx/cjs', 'tsx', 'ts-node/esm', 'ts-node/register', 'ts-node']) {
        expect(checkTypeScriptLoader([loader]), loader).to.be.true
      }
    })

    it('reports an error for TypeScript tests without a loader', () => {
      expect(checkTypeScriptLoader([])).to.be.false

      const validation = validateTypeScriptSetup(['basic_test.ts'], [])
      expect(validation.hasError).to.be.true
      expect(validation.message).to.include('TypeScript Test Files Detected')
    })

    it('passes when there are no TypeScript test files', () => {
      expect(validateTypeScriptSetup(['basic_test.js'], []).hasError).to.be.false
    })
  })

  describe('on Bun', () => {
    beforeEach(() => {
      process.versions.bun = '1.4.2'
    })

    // Bun transpiles TypeScript itself, so requiring tsx/ts-node is pointless (#5697)
    it('needs no loader in the require array', () => {
      expect(checkTypeScriptLoader([])).to.be.true
      expect(validateTypeScriptSetup(['basic_test.ts'], []).hasError).to.be.false
    })

    it('still accepts a configured loader', () => {
      expect(checkTypeScriptLoader(['tsx/esm'])).to.be.true
      expect(validateTypeScriptSetup(['basic_test.ts'], ['tsx/esm']).hasError).to.be.false
    })
  })
})
