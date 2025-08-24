exports.config = {
  tests: './*_no_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    BDD: {
      require: './support/bdd_helper.js',
    },
  },
  // New masking configuration with custom patterns
  maskSensitiveData: {
    enabled: true,
    patterns: [
      {
        name: 'Email',
        regex: /(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)/gi,
        mask: '[MASKED_EMAIL]',
      },
      {
        name: 'Credit Card',
        regex: /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
        mask: '[MASKED_CARD]',
      },
      {
        name: 'Phone',
        regex: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
        mask: '[MASKED_PHONE]',
      },
    ],
  },
  gherkin: {
    features: './features/masking.feature',
    steps: ['./features/step_definitions/my_steps.js', './features/step_definitions/my_other_steps.js'],
  },
  include: {},
  bootstrap: false,
  mocha: {},
  name: 'sandbox-masking',
}
