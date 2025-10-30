const { expect } = require('expect')
const { maskData, getMaskConfig, shouldMaskData } = require('../../lib/utils/mask_data')

describe('Mask Data Utility Tests', () => {
  let originalMaskConfig

  beforeEach(() => {
    originalMaskConfig = global.maskSensitiveData
    global.maskSensitiveData = false // Reset to default
  })

  afterEach(() => {
    global.maskSensitiveData = originalMaskConfig
  })

  describe('maskData', () => {
    it('should return original string when config is false', () => {
      const input = 'password=secret123'
      expect(maskData(input, false)).toBe(input)
    })

    it('should return original string when config is null', () => {
      const input = 'password=secret123'
      expect(maskData(input, null)).toBe(input)
    })

    it('should mask data when config is true (boolean)', () => {
      const input = '{"password": "secret123"}'
      const result = maskData(input, true)
      expect(result).toContain('****')
      expect(result).not.toContain('secret123')
    })

    it('should mask data when config is object with enabled true', () => {
      const input = '{"password": "secret123"}'
      const config = { enabled: true }
      const result = maskData(input, config)
      expect(result).toContain('****')
      expect(result).not.toContain('secret123')
    })

    it('should use custom patterns when provided', () => {
      const input = 'email=user@example.com'
      const config = {
        enabled: true,
        patterns: [
          {
            name: 'Email',
            regex: /email=([^\s]+)/gi,
            mask: 'email=****',
          },
        ],
      }
      const result = maskData(input, config)
      expect(result).toBe('email=****')
    })

    it('should return original string when object config has enabled false', () => {
      const input = 'password=secret123'
      const config = { enabled: false }
      expect(maskData(input, config)).toBe(input)
    })
  })

  describe('getMaskConfig', () => {
    it('should return false when no global config set', () => {
      expect(getMaskConfig()).toBe(false)
    })

    it('should return global config when set to boolean', () => {
      global.maskSensitiveData = true
      expect(getMaskConfig()).toBe(true)
    })

    it('should return global config when set to object', () => {
      const config = { enabled: true, patterns: [] }
      global.maskSensitiveData = config
      expect(getMaskConfig()).toBe(config)
    })
  })

  describe('shouldMaskData', () => {
    it('should return false when no global config set', () => {
      expect(shouldMaskData()).toBe(false)
    })

    it('should return true when global config is true', () => {
      global.maskSensitiveData = true
      expect(shouldMaskData()).toBe(true)
    })

    it('should return true when global config object has enabled true', () => {
      global.maskSensitiveData = { enabled: true }
      expect(shouldMaskData()).toBe(true)
    })

    it('should return false when global config object has enabled false', () => {
      global.maskSensitiveData = { enabled: false }
      expect(shouldMaskData()).toBe(false)
    })

    it('should return false when global config object has no enabled property', () => {
      global.maskSensitiveData = { patterns: [] }
      expect(shouldMaskData()).toBe(false)
    })
  })
})
