import { expect } from 'chai'
import { parsePlaywrightBrowsers, getRuntimeInfo } from '../../../lib/command/info.js'

describe('info command', () => {
  describe('getRuntimeInfo', () => {
    let originalBunVersion

    beforeEach(() => {
      originalBunVersion = process.versions.bun
    })

    afterEach(() => {
      if (originalBunVersion === undefined) {
        delete process.versions.bun
      } else {
        process.versions.bun = originalBunVersion
      }
    })

    it('should report bunInfo when running under Bun', async () => {
      process.versions.bun = '1.4.2'
      const info = await getRuntimeInfo()
      expect(info).to.have.property('bunInfo')
      expect(info).to.not.have.property('nodeInfo')
      expect(info.bunInfo[0]).to.equal('bun')
    })

    it('should report nodeInfo when not running under Bun', async () => {
      delete process.versions.bun
      const info = await getRuntimeInfo()
      expect(info).to.have.property('nodeInfo')
      expect(info).to.not.have.property('bunInfo')
      expect(info.nodeInfo[0]).to.equal('Node')
    })

    it('should return an array so the printer shows the version at index 1', async () => {
      delete process.versions.bun
      const { nodeInfo } = await getRuntimeInfo()
      expect(nodeInfo).to.be.an('array')
      expect(nodeInfo.length).to.be.at.least(2)
      expect(nodeInfo[1]).to.be.a('string')
    })
  })

  describe('parsePlaywrightBrowsers', () => {
    describe('old format (Playwright < 1.58)', () => {
      const oldFormatOutput = `browser: chromium version 140.0.7339.186
browser: chromium-headless-shell version 140.0.7339.186
browser: firefox version 141.0
browser: webkit version 26.0`

      it('should parse chromium version', () => {
        const result = parsePlaywrightBrowsers(oldFormatOutput)
        expect(result).to.include('chromium: 140.0.7339.186')
      })

      it('should parse firefox version', () => {
        const result = parsePlaywrightBrowsers(oldFormatOutput)
        expect(result).to.include('firefox: 141.0')
      })

      it('should parse webkit version', () => {
        const result = parsePlaywrightBrowsers(oldFormatOutput)
        expect(result).to.include('webkit: 26.0')
      })

      it('should exclude chromium-headless-shell', () => {
        const result = parsePlaywrightBrowsers(oldFormatOutput)
        expect(result).to.not.include('chromium-headless-shell')
      })

      it('should return all three browsers', () => {
        const result = parsePlaywrightBrowsers(oldFormatOutput)
        expect(result).to.equal('chromium: 140.0.7339.186, firefox: 141.0, webkit: 26.0')
      })
    })

    describe('new format (Playwright 1.58+)', () => {
      const newFormatOutput = `Chrome for Testing 145.0.7632.6 (playwright chromium v1208)
Chromium Headless Shell 145.0.7632.6 (playwright build v1208)
Firefox 146.0.1 (playwright firefox v1509)
Webkit 18.4 (playwright webkit v2140)`

      it('should parse chromium version', () => {
        const result = parsePlaywrightBrowsers(newFormatOutput)
        expect(result).to.include('chromium: 145.0.7632.6')
      })

      it('should parse firefox version', () => {
        const result = parsePlaywrightBrowsers(newFormatOutput)
        expect(result).to.include('firefox: 146.0.1')
      })

      it('should parse webkit version', () => {
        const result = parsePlaywrightBrowsers(newFormatOutput)
        expect(result).to.include('webkit: 18.4')
      })

      it('should exclude Chromium Headless Shell', () => {
        const result = parsePlaywrightBrowsers(newFormatOutput)
        expect(result).to.not.include('Headless')
      })

      it('should return all three browsers', () => {
        const result = parsePlaywrightBrowsers(newFormatOutput)
        expect(result).to.equal('chromium: 145.0.7632.6, firefox: 146.0.1, webkit: 18.4')
      })
    })

    describe('mixed/edge cases', () => {
      it('should handle empty input', () => {
        const result = parsePlaywrightBrowsers('')
        expect(result).to.equal('')
      })

      it('should handle input with no matching browsers', () => {
        const result = parsePlaywrightBrowsers('some random text without browser info')
        expect(result).to.equal('')
      })

      it('should handle case insensitivity for old format', () => {
        const input = 'browser: CHROMIUM version 100.0.0'
        const result = parsePlaywrightBrowsers(input)
        expect(result).to.equal('CHROMIUM: 100.0.0')
      })

      it('should handle case insensitivity for new format', () => {
        const input = 'Chrome 100.0.0 (playwright CHROMIUM v1234)'
        const result = parsePlaywrightBrowsers(input)
        expect(result).to.equal('CHROMIUM: 100.0.0')
      })
    })
  })
})
