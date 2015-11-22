'use strict';
let subs = require('../utils').template;

function AssertionFailedError(params, message) {
  this.params = params;
  this.message = message || 'AssertionFailedError';
  let stack = new Error().stack;
  // this.showDiff = true;
  stack = stack.split("\n").filter((line) => {
    // @todo cut assert things nicer
    return line.indexOf('lib/assert') < 0;  
  });
  this.stack = stack.join("\n");  
  
  this.inspect = () => {
    let params = this.params || {};
    let msg = params.customMessage || '';    
		return msg + subs(this.message, params);    
  }
  
  this.cliMessage = () => {   
    return this.inspect();    
  }
}
	
AssertionFailedError.prototype = Object.create(Error.prototype);  

module.exports = AssertionFailedError; 