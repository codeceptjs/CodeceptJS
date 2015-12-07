'use strict';
let Assertion = require('../assert');
let AssertionFailedError = require('./error');
let template = require('../utils').template;
let output = require('../output');

class EqualityAssertion extends Assertion {
  
  constructor(params) {
    let comparator = function(a,b) {
      return a == b;
    }
    super(comparator, params);
    this.params.type = 'to equal';
  }
  
  getException() {
    let params = this.params;
    params.jar = template(params.jar, params);
    let err = new AssertionFailedError(params, "{{customMessage}}expected {{jar}} {{type}}");
    err.actual = this.params.actual;
    err.expected = this.params.expected;
    
    err.cliMessage = () => {
      let msg = err.message
        .replace('{{jar}}', output.colors.bold('{{jar}}'));
      return template(msg, this.params);
    }
    return err;
  }
  
  addAssertParams() {
    this.params.expected = arguments[0];
    this.params.actual = arguments[1];
    this.params.customMessage = arguments[2] ? arguments[2]+"\n\n" : '';
  } 
}

module.exports = {
  Assertion: EqualityAssertion,
  fileEquals: (file) => {
    return new EqualityAssertion({ file, jar: "contents of {{file}}" }
      );    
  } 
}