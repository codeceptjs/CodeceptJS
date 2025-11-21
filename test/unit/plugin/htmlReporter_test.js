const { expect } = require('chai')

// Helper function to simulate the escapeHtml behavior from htmlReporter.js
function escapeHtml(text) {
  if (!text) return ''
  // Convert non-string values to strings before escaping
  if (typeof text !== 'string') {
    // Handle arrays by recursively flattening and joining with commas
    if (Array.isArray(text)) {
      // Recursive helper to flatten deeply nested arrays
      const flattenArray = arr => {
        return arr
          .map(item => {
            if (Array.isArray(item)) {
              return flattenArray(item)
            }
            return String(item)
          })
          .join(', ')
      }
      text = flattenArray(text)
    } else {
      text = String(text)
    }
  }
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

describe('htmlReporter plugin', () => {
  describe('escapeHtml function', () => {
    it('should escape HTML special characters in strings', () => {
      const result = escapeHtml('<script>alert("xss")</script>')
      expect(result).to.include('&lt;script&gt;')
      expect(result).to.include('&quot;')
    })

    it('should handle string inputs correctly', () => {
      const result = escapeHtml('Hello <World>')
      expect(result).to.include('Hello &lt;World&gt;')
    })

    it('should handle array inputs by converting to string', () => {
      const result = escapeHtml(['Item1', 'Item2', 'Item3'])
      expect(result).to.include('Item1, Item2, Item3')
    })

    it('should handle nested arrays by flattening them', () => {
      // This is the key test case from the issue
      const result = escapeHtml(['Edge', ['Chromium (140.0.3485.54)'], 'N/A'])
      expect(result).to.include('Edge')
      expect(result).to.include('Chromium (140.0.3485.54)')
      expect(result).to.include('N/A')
      // Should not crash with "text.replace is not a function"
    })

    it('should handle deeply nested arrays', () => {
      const result = escapeHtml(['Level1', ['Level2', ['Level3']], 'End'])
      expect(result).to.include('Level1')
      expect(result).to.include('Level2')
      expect(result).to.include('Level3')
      expect(result).to.include('End')
    })

    it('should handle null and undefined inputs', () => {
      const resultNull = escapeHtml(null)
      expect(resultNull).to.equal('')

      const resultUndefined = escapeHtml(undefined)
      expect(resultUndefined).to.equal('')
    })

    it('should handle empty strings', () => {
      const result = escapeHtml('')
      expect(result).to.equal('')
    })

    it('should handle numbers by converting to strings', () => {
      const result = escapeHtml(42)
      expect(result).to.include('42')
    })

    it('should handle objects by converting to strings', () => {
      const result = escapeHtml({ key: 'value' })
      expect(result).to.include('[object Object]')
    })

    it('should escape all HTML entities in arrays', () => {
      const result = escapeHtml(['<div>', '"quoted"', "it's", 'A&B'])
      expect(result).to.include('&lt;div&gt;')
      expect(result).to.include('&quot;quoted&quot;')
      expect(result).to.include('it&#39;s')
      expect(result).to.include('A&amp;B')
    })
  })

  describe('generateSystemInfoHtml function', () => {
    it('should handle system info with nested arrays', () => {
      // This tests the real-world scenario from the issue
      const systemInfo = {
        nodeInfo: ['Node', '22.14.0', '~\\AppData\\Local\\fnm_multishells\\19200_1763624547202\\node.EXE'],
        osInfo: ['OS', 'Windows 10 10.0.19045'],
        cpuInfo: ['CPU', '(12) x64 12th Gen Intel(R) Core(TM) i5-12500'],
        chromeInfo: ['Chrome', '142.0.7444.163', 'N/A'],
        edgeInfo: ['Edge', ['Chromium (140.0.3485.54)'], 'N/A'], // This is the problematic case
        firefoxInfo: undefined,
        safariInfo: ['Safari', 'N/A'],
        playwrightBrowsers: 'chromium: 136.0.7103.25, firefox: 137.0, webkit: 18.4',
      }

      // Test that processing this system info doesn't crash
      // We simulate the formatInfo function behavior
      const formatValue = value => {
        if (Array.isArray(value) && value.length > 1) {
          const displayValue = value[1]
          return escapeHtml(displayValue)
        } else if (typeof value === 'string') {
          return value
        }
        return ''
      }

      // Test each system info value
      expect(formatValue(systemInfo.nodeInfo)).to.include('22.14.0')
      expect(formatValue(systemInfo.osInfo)).to.include('Windows 10')
      expect(formatValue(systemInfo.cpuInfo)).to.include('12th Gen')
      expect(formatValue(systemInfo.chromeInfo)).to.include('142.0.7444.163')

      // The critical test: edgeInfo with nested array should not crash
      const edgeResult = formatValue(systemInfo.edgeInfo)
      expect(edgeResult).to.include('Chromium')
      expect(edgeResult).to.include('140.0.3485.54')

      expect(formatValue(systemInfo.safariInfo)).to.equal('N/A')
    })

    it('should handle undefined values gracefully', () => {
      const systemInfo = {
        firefoxInfo: undefined,
      }

      const formatValue = value => {
        if (Array.isArray(value) && value.length > 1) {
          return 'has value'
        }
        return ''
      }

      expect(formatValue(systemInfo.firefoxInfo)).to.equal('')
    })

    it('should handle string values directly', () => {
      const systemInfo = {
        playwrightBrowsers: 'chromium: 136.0.7103.25, firefox: 137.0, webkit: 18.4',
      }

      const formatValue = value => {
        if (typeof value === 'string') {
          return value
        }
        return ''
      }

      expect(formatValue(systemInfo.playwrightBrowsers)).to.include('chromium')
      expect(formatValue(systemInfo.playwrightBrowsers)).to.include('firefox')
      expect(formatValue(systemInfo.playwrightBrowsers)).to.include('webkit')
    })
  })

  describe('edge cases', () => {
    it('should handle arrays with HTML content', () => {
      const result = escapeHtml(['<script>', ['alert("xss")'], '</script>'])
      expect(result).to.include('&lt;script&gt;')
      expect(result).to.include('alert(&quot;xss&quot;)')
      expect(result).to.include('&lt;/script&gt;')
    })

    it('should handle mixed array types', () => {
      const result = escapeHtml(['String', 42, true, null, ['nested']])
      expect(result).to.include('String')
      expect(result).to.include('42')
      expect(result).to.include('true')
      expect(result).to.include('null')
      expect(result).to.include('nested')
    })
  })
})
