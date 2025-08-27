const { config } = require('../acceptance/codecept.Playwright')

// Extend the base Playwright configuration to add custom locator strategies
const customLocatorConfig = {
  ...config,
  grep: null, // Remove grep filter to run custom locator tests
  helpers: {
    ...config.helpers,
    Playwright: {
      ...config.helpers.Playwright,
      browser: process.env.BROWSER || 'chromium',
      customLocatorStrategies: {
        byRole: (selector, root) => {
          return root.querySelector(`[role="${selector}"]`)
        },
        byTestId: (selector, root) => {
          return root.querySelector(`[data-testid="${selector}"]`)
        },
        byDataQa: (selector, root) => {
          const elements = root.querySelectorAll(`[data-qa="${selector}"]`)
          return Array.from(elements)
        },
        byAriaLabel: (selector, root) => {
          return root.querySelector(`[aria-label="${selector}"]`)
        },
        byPlaceholder: (selector, root) => {
          return root.querySelector(`[placeholder="${selector}"]`)
        },
      },
    },
  },
}

module.exports.config = customLocatorConfig
