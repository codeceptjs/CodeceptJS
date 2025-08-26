const { maskSensitiveData } = require('invisi-data')

/**
 * Mask sensitive data utility for CodeceptJS
 * Supports both boolean and object configuration formats
 *
 * @param {string} input - The string to mask
 * @param {boolean|object} config - Masking configuration
 * @returns {string} - Masked string
 */
function maskData(input, config) {
  if (!config) {
    return input
  }

  // Handle boolean config (backward compatibility)
  if (typeof config === 'boolean' && config === true) {
    return maskSensitiveData(input)
  }

  // Handle object config with custom patterns
  if (typeof config === 'object' && config.enabled === true) {
    const customPatterns = config.patterns || []
    return maskSensitiveData(input, customPatterns)
  }

  return input
}

/**
 * Check if masking is enabled based on global configuration
 *
 * @returns {boolean|object} - Current masking configuration
 */
function getMaskConfig() {
  return global.maskSensitiveData || false
}

/**
 * Check if data should be masked
 *
 * @returns {boolean} - True if masking is enabled
 */
function shouldMaskData() {
  const config = getMaskConfig()
  return config === true || (typeof config === 'object' && config.enabled === true)
}

module.exports = {
  maskData,
  getMaskConfig,
  shouldMaskData,
}
