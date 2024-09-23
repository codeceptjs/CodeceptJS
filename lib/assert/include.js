const Assertion = require('../assert')
const AssertionFailedError = require('./error')
const { template } = require('../utils')
const output = require('../output')

const MAX_LINES = 10

class InclusionAssertion extends Assertion {
  constructor(params = {}) {
    params.jar = params.jar || 'string'
    super(InclusionAssertion.createComparator(), params)
    this.params.type = 'to include'
    this.template = undefined
  }

  static createComparator() {
    return (needle, haystack) => {
      if (Array.isArray(haystack)) {
        return haystack.some((part) => part.includes(needle))
      }
      return haystack.includes(needle)
    }
  }

  getException() {
    const { params } = this
    params.jar = template(params.jar, params)
    const err = new AssertionFailedError(params, '{{customMessage}}expected {{jar}} {{type}} "{{needle}}"')
    err.expected = params.needle
    err.actual = Array.isArray(params.haystack) ? params.haystack.join('\n___(next element)___\n') : params.haystack

    err.cliMessage = () => {
      const msg = this.template
        .replace('{{jar}}', output.colors.bold('{{jar}}'))
        .replace('{{needle}}', output.colors.bold('{{needle}}'))
      return template(msg, params)
    }

    return err
  }

  getFailedAssertion() {
    const err = this.getException()
    const lines = this.params.haystack.split('\n')
    if (lines.length > MAX_LINES) {
      const more = lines.length - MAX_LINES
      err.actual = `${lines.slice(0, MAX_LINES).join('\n')}\n--( ${more} lines more )---`
    }
    return err
  }

  getFailedNegation() {
    this.params.type = 'not to include'
    const err = this.getException()
    const needlePattern = new RegExp(`^.*?\n?^.*?\n?^.*?${escapeRegExp(this.params.needle)}.*?$\n?.*$\n?.*$`, 'm')
    const matched = this.params.haystack.match(needlePattern)

    if (matched) {
      err.actual = `------\n${matched[0].replace(this.params.needle, output.colors.bold(this.params.needle))}\n------`
    }

    return err
  }

  addAssertParams(needle, haystack, customMessage = '') {
    this.params.needle = needle
    this.params.haystack = haystack
    this.params.customMessage = customMessage ? `${customMessage}\n\n` : ''
  }
}

module.exports = {
  Assertion: InclusionAssertion,
  includes: (needleType = 'string') => new InclusionAssertion({ jar: needleType }),
  fileIncludes: (file) => new InclusionAssertion({ file, jar: 'file {{file}}' }),
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
}
