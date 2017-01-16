'use strict';

/**
 * Each command in test executed through `I.` object is wrapped in Step.
 * Step allows logging executed commands and triggers hook before and after step execution.
 */
class Step {

  constructor(helper, name) {
    this.actor = 'I'; // I = actor
    this.helper = helper; // corresponding helper
    this.name = name; // name of a step console
    this.helperMethod = name; // helper method
    this.status = 'pending';
    this.prefix = this.suffix = '';
    Error.captureStackTrace(this);
    this.args = [];
  }

  setArguments(args) {
    this.args = args;
  }

  run() {
    this.args = Array.prototype.slice.call(arguments);
    let result;
    try {
      result = this.helper[this.helperMethod].apply(this.helper, this.args);
      this.status = 'success';
    } catch (err) {
      this.status = 'failed';
      throw err;
    }
    return result;
  }

  humanize() {
    return this.name
    // insert a space before all caps
    .replace(/([A-Z])/g, ' $1')
    // _ chars to spaces
    .replace('_', ' ')
    // uppercase the first character
    .replace(/^(.)|\s(.)/g, function ($1) {
      return $1.toLowerCase();
    });
  }

  humanizeArgs() {
    return this.args.map((arg) => {
      if (typeof arg === "string") {
        return `"${arg}"`;
      } else if (Array.isArray(arg)) {
        return `[${arg.toString()}]`;
      } else if (typeof arg === "function") {
        return "function()";
      } else if (typeof arg === "object") {
        return JSON.stringify(arg);
      } else if (arg.toString) {
        return arg.toString();
      }
      return arg;
    }).join(', ');
  }

  line() {
    var lines = this.stack.split('\n');
    // 3rd line is line where step has been called in test
    if (lines[3]) return lines[3].trim();
    return '';
  }

  toString() {
    return `${this.prefix}${this.actor} ${this.humanize()} ${this.humanizeArgs()}${this.suffix}`;
  }

  toCode() {
    return `${this.prefix}${this.actor}.${this.name}(${this.humanizeArgs()})${this.suffix}`;
  }

}

module.exports = Step;
