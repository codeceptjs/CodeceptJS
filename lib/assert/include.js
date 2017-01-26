'use strict';
let Assertion = require('../assert');
let AssertionFailedError = require('./error');
let template = require('../utils').template;
let output = require('../output');

const MAX_LINES = 10;


class InclusionAssertion extends Assertion {

  constructor(params) {
    params.jar = params.jar || 'string';
    let comparator = function (needle, haystack) {
      if (Array.isArray(haystack)) {
        return haystack.filter(part => part.indexOf(needle) >= 0).length > 0;
      }
      return haystack.indexOf(needle) >= 0;
    };
    super(comparator, params);
    this.params.type = 'to include';
  }

  getException() {
    let params = this.params;
    params.jar = template(params.jar, params);
    let err = new AssertionFailedError(params, '{{customMessage}}expected {{jar}} {{type}} "{{needle}}"');
    err.expected = params.needle;
    err.actual = params.haystack;
    if (Array.isArray(this.params.haystack)) {
      this.params.haystack = this.params.haystack.join("\n___(next element)___\n");
    }
    err.cliMessage = function () {
      let msg = this.template
        .replace('{{jar}}', output.colors.bold('{{jar}}'))
        .replace('{{needle}}', output.colors.bold('{{needle}}'));
      return template(msg, this.params);
    };
    return err;
  }

  getFailedAssertion() {
    let err = this.getException();
    let lines = this.params.haystack.split("\n");
    if (lines.length > MAX_LINES) {
      let more = lines.length - MAX_LINES;
      err.actual = lines.slice(0, MAX_LINES).join("\n") + `\n--( ${more} lines more )---`;
    }
    return err;
  }

  getFailedNegation() {
    this.params.type = 'not to include';
    let err = this.getException();
    let pattern = new RegExp("^.*?\n?^.*?\n?^.*?" + escapeRegExp(this.params.needle) + ".*?$\n?.*$\n?.*$", "m");
    let matched = this.params.haystack.match(pattern);
    if (!matched) return err;
    err.actual = matched[0].replace(this.params.needle, output.colors.bold(this.params.needle));
    err.actual = `------\n${err.actual}\n------`;
    return err;
  }

  addAssertParams() {
    this.params.needle = arguments[0];
    this.params.haystack = arguments[1];
    this.params.customMessage = arguments[2] ? arguments[2] + "\n\n" : '';
  }
}

module.exports = {
  Assertion: InclusionAssertion,
  includes: (needleType) => {
    needleType = needleType || 'string';
    return new InclusionAssertion({jar: needleType});
  },
  fileIncludes: (file) => {
    return new InclusionAssertion({ file, jar: "file {{file}}" }
      );
  }
};

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
